import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import asaas, {
  tokenizeCreditCard,
  getOrCreateCustomer,
  cleanCpfCnpj,
  asaasConfig,
  AsaasCreditCard,
  AsaasCreditCardHolderInfo,
} from '@/lib/asaas';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'fayapoint-secret';

// Interface for saved card
interface ISavedCard {
  _id: mongoose.Types.ObjectId;
  token: string;
  lastFour: string;
  brand: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: Date;
}

// =============================================================================
// HELPER
// =============================================================================

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    return await User.findById(decoded.id);
  } catch {
    return null;
  }
}

// =============================================================================
// GET - List User's Saved Cards
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    const savedCards: ISavedCard[] = userDoc.savedCards || [];

    // Return cards with masked info
    return NextResponse.json({
      cards: savedCards.map((card: ISavedCard) => ({
        id: card._id,
        lastFour: card.lastFour,
        brand: card.brand,
        holderName: card.holderName,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        isDefault: card.isDefault,
        createdAt: card.createdAt,
      })),
    });

  } catch (error) {
    console.error('[SavedCards] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Save New Card (Tokenize)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!asaasConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 503 }
      );
    }

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      cardNumber,
      holderName,
      expiryMonth,
      expiryYear,
      ccv,
      cpfCnpj,
      postalCode,
      addressNumber,
      phone,
      setAsDefault = false,
    } = body as {
      cardNumber: string;
      holderName: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      phone?: string;
      setAsDefault?: boolean;
    };

    // Validate required fields
    if (!cardNumber || !holderName || !expiryMonth || !expiryYear || !ccv || !cpfCnpj || !postalCode || !addressNumber) {
      return NextResponse.json(
        { error: 'Dados do cartão incompletos' },
        { status: 400 }
      );
    }

    const cleanedCpfCnpj = cleanCpfCnpj(cpfCnpj);

    // Get or create Asaas customer
    let asaasCustomer;
    try {
      asaasCustomer = await getOrCreateCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj: cleanedCpfCnpj,
        phone,
        mobilePhone: phone,
        externalReference: String(user._id),
        postalCode: postalCode.replace(/\D/g, ''),
        addressNumber,
      });
    } catch (error) {
      console.error('[SavedCards] Error creating customer:', error);
      return NextResponse.json(
        { error: 'Erro ao criar cliente no gateway' },
        { status: 500 }
      );
    }

    // Prepare card data
    const cardData: AsaasCreditCard = {
      holderName,
      number: cardNumber.replace(/\D/g, ''),
      expiryMonth,
      expiryYear,
      ccv,
    };

    const holderInfo: AsaasCreditCardHolderInfo = {
      name: holderName,
      email: user.email,
      cpfCnpj: cleanedCpfCnpj,
      postalCode: postalCode.replace(/\D/g, ''),
      addressNumber,
      phone,
      mobilePhone: phone,
    };

    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '0.0.0.0';

    // Tokenize the card
    let tokenResult;
    try {
      tokenResult = await tokenizeCreditCard(
        asaasCustomer.id!,
        cardData,
        holderInfo,
        clientIp.split(',')[0].trim()
      );
    } catch (error) {
      console.error('[SavedCards] Tokenization error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao salvar cartão' },
        { status: 500 }
      );
    }

    // Save card to user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    if (!userDoc.savedCards) userDoc.savedCards = [];

    // Check if card already exists
    const existingCardIndex = userDoc.savedCards.findIndex(
      (c: ISavedCard) => c.lastFour === tokenResult.creditCardNumber
    );

    if (existingCardIndex >= 0) {
      // Update existing card
      userDoc.savedCards[existingCardIndex].token = tokenResult.creditCardToken;
      userDoc.savedCards[existingCardIndex].brand = tokenResult.creditCardBrand;
    } else {
      // Add new card
      const newCard = {
        _id: new mongoose.Types.ObjectId(),
        token: tokenResult.creditCardToken,
        lastFour: tokenResult.creditCardNumber,
        brand: tokenResult.creditCardBrand,
        holderName,
        expiryMonth,
        expiryYear,
        isDefault: setAsDefault || userDoc.savedCards.length === 0,
        createdAt: new Date(),
      };

      // If setting as default, unset other defaults
      if (newCard.isDefault) {
        userDoc.savedCards.forEach((c: ISavedCard) => {
          c.isDefault = false;
        });
      }

      userDoc.savedCards.push(newCard);
    }

    // Store Asaas customer ID and billing info
    if (!userDoc.billing) userDoc.billing = {};
    userDoc.billing.asaasCustomerId = asaasCustomer.id;
    
    // Save billing info for autofill
    if (cleanedCpfCnpj && !userDoc.billing.cpfCnpj) {
      userDoc.billing.cpfCnpj = cleanedCpfCnpj;
    }
    if (phone && !userDoc.billing.phone) {
      userDoc.billing.phone = phone;
    }
    if (postalCode && !userDoc.billing.postalCode) {
      userDoc.billing.postalCode = postalCode.replace(/\D/g, '');
    }
    if (addressNumber && !userDoc.billing.addressNumber) {
      userDoc.billing.addressNumber = addressNumber;
    }

    await userDoc.save();

    return NextResponse.json({
      success: true,
      card: {
        lastFour: tokenResult.creditCardNumber,
        brand: tokenResult.creditCardBrand,
        holderName,
        isDefault: setAsDefault || userDoc.savedCards.length === 1,
      },
    });

  } catch (error) {
    console.error('[SavedCards] POST Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Remove Saved Card
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json({ error: 'ID do cartão é obrigatório' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    if (!userDoc.savedCards) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    const cardIndex = userDoc.savedCards.findIndex(
      (c: ISavedCard) => c._id.toString() === cardId
    );

    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    const wasDefault = userDoc.savedCards[cardIndex].isDefault;
    userDoc.savedCards.splice(cardIndex, 1);

    // If deleted card was default, set first remaining as default
    if (wasDefault && userDoc.savedCards.length > 0) {
      userDoc.savedCards[0].isDefault = true;
    }

    await userDoc.save();

    return NextResponse.json({
      success: true,
      message: 'Cartão removido com sucesso',
    });

  } catch (error) {
    console.error('[SavedCards] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
