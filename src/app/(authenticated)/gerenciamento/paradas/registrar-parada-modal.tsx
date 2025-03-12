import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registrarParadaSchema = z.object({
  tipo_id: z.string().min(1, "Selecione o tipo de parada"),
  previsao_minutos: z.number().min(1, "Informe a previsão em minutos"),
  motivo: z.string().min(1, "Informe o motivo da parada"),
});

type RegistrarParadaForm = z.infer<typeof registrarParadaSchema>;

interface RegistrarParadaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frotaId: string;
  tiposParada: Array<{ id: string; nome: string }>;
  onSubmit: (data: RegistrarParadaForm) => Promise<void>;
}

export function RegistrarParadaModal({
  open,
  onOpenChange,
  frotaId,
  tiposParada,
  onSubmit,
}: RegistrarParadaModalProps) {
  const form = useForm<RegistrarParadaForm>({
    resolver: zodResolver(registrarParadaSchema),
    defaultValues: {
      tipo_id: "",
      previsao_minutos: 0,
      motivo: "",
    },
  });

  const handleSubmit = async (data: RegistrarParadaForm) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar parada:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Parada</DialogTitle>
          <DialogDescription>
            Preencha as informações para registrar uma nova parada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Parada</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de parada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposParada.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previsao_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previsão (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Registrar Parada</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 