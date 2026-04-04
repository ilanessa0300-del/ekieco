import { useGetListings, useGetStatsSummary, useGetPurchaseRequests, useReserveListing, useRespondToPurchaseRequest, getGetListingsQueryKey, getGetPurchaseRequestsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Map } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Box, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

function ListingCard({ listing, isRequest = false }: { listing: any, isRequest?: boolean }) {
  const isVip = !isRequest && listing.isVip;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reserveListing = useReserveListing();
  const respondRequest = useRespondToPurchaseRequest();
  const { isAuthenticated } = useAuth();

  const handleAction = async () => {
    if (!isAuthenticated) {
      toast({ title: "Ошибка", description: "Необходимо войти в систему", variant: "destructive" });
      return;
    }
    
    try {
      if (isRequest) {
        await respondRequest.mutateAsync({ id: listing.id });
        queryClient.invalidateQueries({ queryKey: getGetPurchaseRequestsQueryKey() });
        toast({ title: "Успешно", description: "Вы откликнулись на заявку" });
      } else {
        await reserveListing.mutateAsync({ id: listing.id });
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        toast({ title: "Успешно", description: "Объявление забронировано" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Действие не удалось", variant: "destructive" });
    }
  };

  const isPending = reserveListing.isPending || respondRequest.isPending;
  const isDisabled = isRequest ? listing.status !== 'open' : listing.status !== 'active';

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md ${isVip ? 'border-accent ring-1 ring-accent/20' : ''}`}>
      {isVip && (
        <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-2 py-0.5 text-xs font-bold rounded-bl-md z-10">
          ТОП
        </div>
      )}
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
        {!isRequest && listing.photoUrl && (
          <div className="sm:w-32 h-32 sm:h-auto rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img src={listing.photoUrl} alt="Отходы" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                {listing.wasteType}
                <Badge variant={isRequest ? "outline" : "default"} className={isRequest ? "text-accent border-accent" : "bg-primary"}>
                  {isRequest ? "Покупка" : "Продажа"}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.address || "Экибастуз"}
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold flex items-center justify-end gap-1">
                <Box className="h-4 w-4 text-muted-foreground" />
                {listing.volume}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(listing.createdAt), "d MMM", { locale: ru })}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
            {listing.description || "Без описания"}
          </p>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Комиссия платформы: 5%</span>
            <Button 
              size="sm" 
              variant={isRequest ? "outline" : "default"} 
              className={isRequest ? "border-accent text-accent hover:bg-accent hover:text-accent-foreground" : "bg-primary"}
              onClick={handleAction}
              disabled={isPending || isDisabled}
            >
              {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {isDisabled ? (isRequest ? 'Закрыто' : 'Недоступно') : (isRequest ? "Откликнуться" : "Забронировать")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: stats } = useGetStatsSummary();
  const { data: listings = [] } = useGetListings();
  const { data: requests = [] } = useGetPurchaseRequests();

  const mapMarkers = [
    ...listings.map(l => ({ id: `l-${l.id}`, lat: l.lat, lng: l.lng, type: "sale" as const })),
    ...requests.map(r => ({ id: `r-${r.id}`, lat: r.lat, lng: r.lng, type: "purchase" as const }))
  ];

  return (
    <Layout>
      {/* Stats Bar */}
      <div className="bg-sidebar border-b border-border py-3">
        <div className="container max-w-screen-2xl px-4 md:px-8 flex flex-wrap gap-4 sm:gap-8 justify-center sm:justify-start text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Всего заявок</span>
            <span className="font-mono font-bold">{stats?.totalListings || 0} продаж / {stats?.totalRequests || 0} покупок</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Участников</span>
            <span className="font-mono font-bold">{stats?.totalUsers || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Топ отход</span>
            <span className="font-mono font-bold text-primary">{stats?.topWasteType || "Пластик"}</span>
          </div>
        </div>
      </div>

      <div className="container max-w-screen-2xl px-4 md:px-8 py-6 sm:py-8 flex flex-col gap-8">
        
        {/* Hero Section with Map and CTAs */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-sm border border-border relative">
            <Map markers={mapMarkers} className="w-full h-[300px] sm:h-[450px] z-0" />
            <div className="absolute bottom-4 left-4 z-10 flex gap-2 bg-background/90 backdrop-blur p-2 rounded-lg shadow-md border border-border/50">
              <div className="flex items-center gap-1 text-xs font-medium">
                <div className="w-3 h-3 rounded-full bg-primary border border-white"></div> Продажа
              </div>
              <div className="flex items-center gap-1 text-xs font-medium ml-2">
                <div className="w-3 h-3 rounded-full bg-accent border border-white"></div> Покупка
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">Разместить объявление</h2>
                  <p className="text-sm text-muted-foreground">Добавьте свои отходы на биржу и найдите переработчиков в Экибастузе.</p>
                </div>
                <Link href="/listings/new">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-lg h-14" size="lg">
                    Добавить отходы <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                
                <div className="h-px bg-border my-2"></div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">Ищете сырье?</h2>
                  <p className="text-sm text-muted-foreground">Оставьте заявку на покупку нужного вам объема и типа отходов.</p>
                </div>
                <Link href="/requests/new">
                  <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground text-lg h-14" size="lg">
                    Разместить заявку <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Listings Feed */}
        <div className="max-w-4xl mx-auto w-full">
          <Tabs defaultValue="sell" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Лента объявлений</h2>
              <TabsList className="bg-muted">
                <TabsTrigger value="sell" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Продают</TabsTrigger>
                <TabsTrigger value="buy" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Покупают</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sell" className="flex flex-col gap-4 mt-0">
              {listings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  Нет активных объявлений о продаже
                </div>
              ) : (
                <>
                  {listings.slice(0, 3).map(l => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                  
                  {listings.length > 3 && (
                    <div className="my-4 p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-center text-sm font-medium text-muted-foreground">
                      Рекламное место
                    </div>
                  )}

                  {listings.slice(3).map(l => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="buy" className="flex flex-col gap-4 mt-0">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  Нет активных заявок на покупку
                </div>
              ) : (
                requests.map(r => (
                  <ListingCard key={r.id} listing={r} isRequest />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </Layout>
  );
}
