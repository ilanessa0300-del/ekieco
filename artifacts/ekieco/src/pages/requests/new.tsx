import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePurchaseRequest, getGetPurchaseRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Map } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const WASTE_TYPES = ["масло", "шины", "пластик", "металл", "бумага/картон", "другое"];
const EKIBASTUZ_CENTER: [number, number] = [51.7237, 75.3229];

export default function CreateRequest() {
  const [wasteType, setWasteType] = useState("");
  const [volume, setVolume] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  
  const [location, setLocationCoord] = useState<{lat: number, lng: number} | null>(null);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRequest = useCreatePurchaseRequest();

  const handleMapClick = (e: any) => {
    setLocationCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wasteType || !volume || !location) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля и выберите местоположение на карте",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRequest.mutateAsync({
        data: {
          wasteType,
          volume,
          description: description || undefined,
          address: address || undefined,
          lat: location.lat,
          lng: location.lng,
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetPurchaseRequestsQueryKey() });
      
      toast({
        title: "Успешно",
        description: "Заявка успешно размещена",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать заявку",
        variant: "destructive",
      });
    }
  };

  const mapMarkers = location ? [{
    id: "new-location",
    lat: location.lat,
    lng: location.lng,
    type: "purchase" as const
  }] : [];

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Разместить заявку на покупку</h1>
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-border shadow-sm border-accent/20">
              <CardHeader>
                <CardTitle>Требуемое сырье</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wasteType">Тип отходов <span className="text-destructive">*</span></Label>
                  <Select value={wasteType} onValueChange={setWasteType}>
                    <SelectTrigger id="wasteType">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {WASTE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Необходимый объем <span className="text-destructive">*</span></Label>
                  <Input 
                    id="volume" 
                    placeholder="Например: от 500 кг, 2 тонны ежемесячно" 
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание / Требования к сырью</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Требования к чистоте, сортировке, упаковке и т.д." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Местоположение базы/завода</CardTitle>
                <CardDescription>Укажите точку на карте <span className="text-destructive">*</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[300px] w-full rounded-md overflow-hidden border border-border">
                  <Map 
                    center={EKIBASTUZ_CENTER} 
                    zoom={13} 
                    interactive={true} 
                    onMapClick={handleMapClick}
                    markers={mapMarkers}
                    className="h-full w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес (опционально)</Label>
                  <Input 
                    id="address" 
                    placeholder="Промзона, ул. Машиностроителей 8" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-12" 
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Разместить заявку
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
