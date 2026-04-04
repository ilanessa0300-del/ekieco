import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateListing, getGetListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Map } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import { WASTE_TYPES, EKIBASTUZ_CENTER } from "@/lib/ekibastuz-streets";

export default function CreateListing() {
  const [title, setTitle] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [volume, setVolume] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [location, setLocationCoord] = useState<{ lat: number; lng: number } | null>(null);

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createListing = useCreateListing();

  const handleMapClick = (e: any) => {
    setLocationCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteType || !volume || !location) {
      toast({ title: "Заполните обязательные поля", description: "Укажите тип, объём и точку на карте", variant: "destructive" });
      return;
    }
    try {
      await createListing.mutateAsync({
        data: {
          title: title || undefined,
          wasteType,
          volume,
          description: description || undefined,
          photoUrl: photoUrl || undefined,
          address: address || undefined,
          lat: location.lat,
          lng: location.lng,
          isVip,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
      toast({ title: "Объявление опубликовано" });
      navigate("/listings");
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Не удалось создать объявление", variant: "destructive" });
    }
  };

  const mapMarkers = location
    ? [{ id: "new-location", lat: location.lat, lng: location.lng, type: "sale" as const }]
    : [];

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Добавить отходы на продажу</h1>
          <p className="text-muted-foreground text-sm mt-1">Заполните форму — объявление появится на карте Экибастуза</p>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название объявления</Label>
                  <Input
                    id="title"
                    placeholder="Например: Продам металлолом с завода"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wasteType">Тип отходов <span className="text-destructive">*</span></Label>
                  <Select value={wasteType} onValueChange={setWasteType}>
                    <SelectTrigger id="wasteType">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {WASTE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Объём <span className="text-destructive">*</span></Label>
                  <Input
                    id="volume"
                    placeholder="Например: 500 кг, 2 тонны, 10 бочек"
                    value={volume}
                    onChange={e => setVolume(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Состояние, условия самовывоза, дополнительная информация..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Ссылка на фото (опционально)</Label>
                  <Input
                    id="photoUrl"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-border">
                  <Checkbox
                    id="isVip"
                    checked={isVip}
                    onCheckedChange={checked => setIsVip(checked as boolean)}
                  />
                  <Label htmlFor="isVip" className="cursor-pointer font-medium flex items-center gap-2">
                    VIP-объявление{" "}
                    <span className="text-xs bg-accent text-white px-1.5 py-0.5 rounded font-bold">ТОП</span>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Местоположение</CardTitle>
                <CardDescription>
                  Кликните на карте, чтобы указать точку{" "}
                  <span className="text-destructive">*</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[280px] w-full rounded-md overflow-hidden border border-border">
                  <Map
                    center={EKIBASTUZ_CENTER}
                    zoom={13}
                    interactive={true}
                    onMapClick={handleMapClick}
                    markers={mapMarkers}
                    className="h-full w-full"
                  />
                </div>

                {location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    Точка выбрана: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес в Экибастузе</Label>
                  <AddressAutocomplete
                    id="address"
                    value={address}
                    onChange={setAddress}
                    placeholder="Начните вводить улицу..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted/60 p-4 rounded-lg border border-border text-sm flex justify-between">
              <span className="text-muted-foreground">Комиссия платформы</span>
              <span className="font-medium">5% при успешной сделке</span>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-base h-12"
              disabled={createListing.isPending}
            >
              {createListing.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Опубликовать
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
