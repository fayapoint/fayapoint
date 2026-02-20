"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Trash2, X, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatarWithBadges } from "./UserAvatarWithBadges";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface Achievement {
  id: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface ProfileAvatarEditorProps {
  user: {
    name: string;
    image?: string;
  };
  achievements?: Achievement[];
  isPro?: boolean;
  onAvatarUpdate?: (newImageUrl: string | null) => void;
  className?: string;
}

export function ProfileAvatarEditor({
  user,
  achievements = [],
  isPro = false,
  onAvatarUpdate,
  className,
}: ProfileAvatarEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('fayai_token');
      if (!token) {
        toast.error('Você precisa estar logado.');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      toast.success('Avatar atualizado com sucesso!');
      onAvatarUpdate?.(data.imageUrl);
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('fayai_token');
      if (!token) {
        toast.error('Você precisa estar logado.');
        return;
      }

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover avatar');
      }

      toast.success('Avatar removido com sucesso!');
      onAvatarUpdate?.(null);
      handleClose();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setDragActive(false);
  };

  return (
    <>
      {/* Avatar with edit button */}
      <div className={cn("relative group", className)}>
        <UserAvatarWithBadges
          user={user}
          achievements={achievements}
          size="xl"
          isPro={isPro}
          showBadges={true}
          editable={true}
          onClick={() => setIsOpen(true)}
        />
        
        {/* Camera icon overlay on hover */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Camera className="w-8 h-8 text-white" />
        </motion.button>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Avatar</DialogTitle>
            <DialogDescription>
              Faça upload de uma nova foto de perfil ou remova a atual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current/Preview Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <UserAvatarWithBadges
                  user={{ 
                    name: user.name, 
                    image: previewUrl || user.image 
                  }}
                  achievements={achievements}
                  size="xl"
                  isPro={isPro}
                  showBadges={true}
                />
                {previewUrl && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                dragActive 
                  ? "border-purple-500 bg-purple-500/10" 
                  : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleInputChange}
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {dragActive ? (
                  <motion.div
                    key="drag"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-2"
                  >
                    <Upload className="w-12 h-12 mx-auto text-purple-400" />
                    <p className="text-purple-400 font-medium">Solte aqui!</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <Upload className="w-10 h-10 mx-auto text-gray-500" />
                    <p className="text-gray-400">
                      Arraste uma imagem ou <span className="text-purple-400 font-medium">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      JPG, PNG, WebP ou GIF • Máximo 5MB
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected file info */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {user.image && !selectedFile && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </>
                  )}
                </Button>
              )}
              
              {selectedFile && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Tips */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Para melhores resultados, use uma imagem quadrada com seu rosto centralizado.
                A imagem será redimensionada automaticamente.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
