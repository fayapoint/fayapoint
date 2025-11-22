"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Upload, Check, X, Plus, Trash2, Facebook, Instagram, Linkedin, Twitter, Globe, MessageCircle, User as UserIcon, Briefcase, Heart, MessageSquare, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';

// --- Icons Mapping ---
const socialIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  other: <Globe className="w-4 h-4" />,
};

// --- Form Schema ---
const profileSchema = z.object({
  // Basic
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  gender: z.string().optional(),
  birthDate: z.date().optional(),
  image: z.string().optional(),
  bio: z.string().optional(),
  
  // Professional
  profession: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal('')),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.string().optional(), // Comma separated
  languages: z.string().optional(), // Comma separated
  
  // Personal
  interests: z.string().optional(), // Comma separated
  goals: z.string().optional(),
  values: z.string().optional(),
  personality: z.string().optional(),
  funFacts: z.string().optional(),
  inspirations: z.string().optional(),
  
  // Preferences
  targetAudience: z.string().optional(),
  marketSegment: z.string().optional(),
  contentPreferences: z.string().optional(),
  communicationTone: z.string().optional(),
  
  // Contact
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url("URL inválida"),
  })).optional(),
  contactAvailability: z.string().optional(),
  importantLinks: z.string().optional(), // Comma separated
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function CompleteRegistrationForm() {
  const { user, setUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      socialLinks: [{ platform: 'linkedin', url: '' }],
      location: { city: '', state: '', country: 'Brasil' },
    },
  });

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  // Load user data on open
  useEffect(() => {
    if (isOpen && user?.email) {
      // Fetch full user data
      fetch(`/api/users?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.exists && data.user) {
            const u = data.user;
            form.reset({
              name: u.name || user.name,
              email: u.email || user.email,
              gender: u.gender,
              birthDate: u.birthDate ? new Date(u.birthDate) : undefined,
              image: u.image,
              bio: u.bio,
              profession: u.profession,
              company: u.company,
              website: u.website,
              experience: u.experience,
              education: u.education,
              skills: u.skills?.join(', '),
              languages: u.languages?.join(', '),
              interests: u.interests?.join(', '),
              goals: u.goals,
              values: u.values,
              personality: u.personality,
              funFacts: u.funFacts,
              inspirations: u.inspirations,
              targetAudience: u.targetAudience,
              marketSegment: u.marketSegment,
              contentPreferences: u.contentPreferences,
              communicationTone: u.communicationTone,
              phone: u.phone,
              whatsapp: u.whatsapp,
              location: u.location || { country: 'Brasil' },
              socialLinks: u.socialLinks?.length ? u.socialLinks : [{ platform: 'linkedin', url: '' }],
              contactAvailability: u.contactAvailability,
              importantLinks: u.importantLinks?.join(', '),
            });
            
            if (u.bookDiscountCode) {
              setSuccessCode(u.bookDiscountCode);
            }
          }
        });
    }
  }, [isOpen, user, form]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      // Generate discount code if not exists
      const code = `BOOK90-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Transform comma separated strings to arrays
      const formattedData = {
        ...data,
        skills: data.skills?.split(',').map(s => s.trim()).filter(Boolean),
        languages: data.languages?.split(',').map(s => s.trim()).filter(Boolean),
        interests: data.interests?.split(',').map(s => s.trim()).filter(Boolean),
        importantLinks: data.importantLinks?.split(',').map(s => s.trim()).filter(Boolean),
        bookDiscountCode: successCode || code, // Keep existing or new
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      const result = await res.json();

      if (result.success) {
        setUser(result.user);
        setSuccessCode(result.user.bookDiscountCode);
        toast.success("Perfil atualizado com sucesso!");
        
        // Simulate Email Sending
        console.log("--- MOCKED EMAIL SERVICE ---");
        console.log(`To: ${data.email}`);
        console.log(`Subject: Seu código de desconto de 90% no livro!`);
        console.log(`Body: Olá ${data.name}, parabéns por completar seu cadastro! Seu código é: ${result.user.bookDiscountCode}. Use o link: https://pay.hotmart.com/K82132554A?checkoutMode=2&off=nahl8ncj`);
        console.log("----------------------------");
        
        toast("Código enviado para seu email! (Verifique o console)", { icon: '📧' });
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105"
        >
          Completar Cadastro & Ganhar 90% OFF no Livro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Complete seu Cadastro Profissional</DialogTitle>
          <DialogDescription className="text-center">
            Preencha todos os campos para desbloquear seu desconto exclusivo de 90%.
          </DialogDescription>
        </DialogHeader>

        {successCode ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="bg-green-100 dark:bg-green-800 p-4 rounded-full">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">Cadastro Completo!</h3>
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Seu código de desconto exclusivo é:</p>
              <div className="text-4xl font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 select-all bg-white dark:bg-black/20 px-6 py-3 rounded-lg border-2 border-dashed border-amber-500">
                {successCode}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Também enviamos para seu email: {form.getValues('email')}</p>
            </div>
            <Button 
              className="w-full max-w-md hotmart-fb hotmart__button-checkout"
              onClick={() => window.open('https://pay.hotmart.com/K82132554A?checkoutMode=2&off=nahl8ncj', '_blank')}
            >
              Comprar Agora com 90% OFF
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic"><UserIcon className="w-4 h-4 mr-2" /> Básico</TabsTrigger>
                  <TabsTrigger value="professional"><Briefcase className="w-4 h-4 mr-2" /> Profissional</TabsTrigger>
                  <TabsTrigger value="personal"><Heart className="w-4 h-4 mr-2" /> Pessoal</TabsTrigger>
                  <TabsTrigger value="preferences"><MessageSquare className="w-4 h-4 mr-2" /> Preferências</TabsTrigger>
                  <TabsTrigger value="contact"><MapPin className="w-4 h-4 mr-2" /> Contato</TabsTrigger>
                </TabsList>

                {/* --- BASIC INFO --- */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl><Input placeholder="seu@email.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="birthDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField control={form.control} name="image" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foto de Perfil</FormLabel>
                        <div className="flex items-center gap-4">
                          {field.value && <img src={field.value} alt="Preview" className="w-16 h-16 rounded-full object-cover border" />}
                          <div className="flex-1 space-y-2">
                            <FormControl><Input placeholder="Cole a URL da imagem..." {...field} /></FormControl>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Ou upload:</span>
                              <Input type="file" accept="image/*" onChange={handleFileUpload} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl><Textarea placeholder="Fale um pouco sobre você..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>

                {/* --- PROFESSIONAL --- */}
                <TabsContent value="professional" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="profession" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl><Input placeholder="Ex: Desenvolvedor Fullstack" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="company" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl><Input placeholder="Ex: Fayapoint AI" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiência Profissional</FormLabel>
                      <FormControl><Textarea placeholder="Resumo da sua experiência..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="education" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formação Acadêmica</FormLabel>
                      <FormControl><Textarea placeholder="Seus cursos e graduações..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="skills" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habilidades (separe por vírgula)</FormLabel>
                      <FormControl><Input placeholder="Ex: React, Node.js, Marketing, Vendas" {...field} /></FormControl>
                      <FormDescription>Principais competências técnicas e comportamentais</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="languages" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idiomas (separe por vírgula)</FormLabel>
                      <FormControl><Input placeholder="Ex: Português, Inglês Avançado" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>

                {/* --- PERSONAL --- */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <FormField control={form.control} name="interests" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interesses (separe por vírgula)</FormLabel>
                      <FormControl><Input placeholder="Ex: Tecnologia, Viagens, Cinema" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="personality" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personalidade</FormLabel>
                        <FormControl><Input placeholder="Ex: Criativo, Introvertido..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="values" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valores Pessoais</FormLabel>
                        <FormControl><Input placeholder="Ex: Honestidade, Liberdade..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="goals" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivos Pessoais e Profissionais</FormLabel>
                      <FormControl><Textarea placeholder="Onde você quer chegar?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="inspirations" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referências Inspiradoras</FormLabel>
                      <FormControl><Textarea placeholder="Quem te inspira?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="funFacts" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curiosidades Pessoais</FormLabel>
                      <FormControl><Textarea placeholder="Algo único sobre você..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>

                {/* --- PREFERENCES --- */}
                <TabsContent value="preferences" className="space-y-4 mt-4">
                  <FormField control={form.control} name="targetAudience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Público-alvo</FormLabel>
                      <FormControl><Input placeholder="Ex: Empreendedores, Estudantes..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="marketSegment" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segmento de Mercado</FormLabel>
                      <FormControl><Input placeholder="Ex: E-commerce, Educação..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contentPreferences" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferências de Conteúdo</FormLabel>
                      <FormControl><Input placeholder="Ex: Vídeos curtos, Artigos técnicos..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="communicationTone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tom de Voz</FormLabel>
                      <FormControl><Input placeholder="Ex: Formal, Descontraído, Técnico..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>

                {/* --- CONTACT --- */}
                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl><Input placeholder="+55 11 99999-9999" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl><Input placeholder="+55 11 99999-9999" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="location.city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="location.state" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl><Input placeholder="SP" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="location.country" render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl><Input placeholder="Brasil" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Redes Sociais</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendSocial({ platform: 'linkedin', url: '' })}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar
                      </Button>
                    </div>
                    {socialFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end">
                         <FormField control={form.control} name={`socialLinks.${index}.platform`} render={({ field }) => (
                          <FormItem className="w-[150px]">
                             <FormControl>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                                  <SelectItem value="instagram">Instagram</SelectItem>
                                  <SelectItem value="facebook">Facebook</SelectItem>
                                  <SelectItem value="twitter">Twitter/X</SelectItem>
                                  <SelectItem value="website">Website</SelectItem>
                                  <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                             </FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`socialLinks.${index}.url`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder="Link do perfil" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <FormField control={form.control} name="contactAvailability" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilidade para Contato</FormLabel>
                      <FormControl><Input placeholder="Ex: Horário comercial, Seg-Sex..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                   <FormField control={form.control} name="importantLinks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Links Importantes (separe por vírgula)</FormLabel>
                      <FormControl><Input placeholder="Portfólio, Artigos..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isLoading ? "Salvando..." : "Salvar e Obter Código"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
