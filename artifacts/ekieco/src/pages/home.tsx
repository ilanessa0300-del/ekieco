import { useState, useMemo } from "react";
import { useGetListings, useGetStatsSummary, useGetPurchaseRequests, useReserveListing, useRespondToPurchaseRequest, getGetListingsQueryKey, getGetPurchaseRequestsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Map } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Box, ArrowRight, Loader2, Search, X, Phone } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { WASTE_TYPES, EKIBASTUZ_STREETS } from "@/lib/ekibastuz-streets";

function ListingCard({ listing, isRequest = false }: { listing: any; isRequest?: boolean }) {
  const isVip = !isRequest && listing.isVip;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reserveListing = useReserveListing();
  const respondRequest = useRespondToPurchaseRequest();
  const { isAuthenticated } = useAuth();

  const handleAction = async () => {
    if (!isAuthenticated) {
      toast({ title: "Необходима авторизация", description: "Войдите в систему, чтобы выполнить это действие", variant: "destructive" });
      return;
    }
    try {
      if (isRequest) {
        await respondRequest.mutateAsync({ id: listing.id });
        queryClient.invalidateQueries({ queryKey: getGetPurchaseRequestsQueryKey() });
        toast({ title: "Отклик отправлен", description: "Продавец получит уведомление" });
      } else {
        await reserveListing.mutateAsync({ id: listing.id });
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        toast({ title: "Забронировано", description: "Свяжитесь с продавцом для уточнения деталей" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Действие не удалось", variant: "destructive" });
    }
  };

  const isPending = reserveListing.isPending || respondRequest.isPending;
  const isDisabled = isRequest ? listing.status !== "open" : listing.status !== "active";

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md ${isVip ? "border-accent ring-1 ring-accent/20" : ""}`}>
      {isVip && (
        <div className="absolute top-0 right-0 bg-accent text-white px-2 py-0.5 text-xs font-bold rounded-bl-md z-10">
          ТОП
        </div>
      )}
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
        {!isRequest && listing.photoUrl && (
          <div className="sm:w-28 h-28 sm:h-auto rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img src={listing.photoUrl} alt="Отходы" className="w-full h-full object-cover" />
          </div>
        )}
        {!listing.photoUrl && !isRequest && (
          <div className="hidden sm:flex sm:w-28 h-28 sm:h-auto rounded-md bg-muted/60 flex-shrink-0 items-center justify-center text-muted-foreground text-xs">
            Нет фото
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight">
                {listing.title || (isRequest ? `Куплю: ${listing.wasteType}` : `Продам: ${listing.wasteType}`)}
              </h3>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <Badge variant="outline" className={isRequest ? "text-accent border-accent text-xs" : "text-primary border-primary text-xs"}>
                  {listing.wasteType}
                </Badge>
                {!isRequest && <span className="text-xs text-muted-foreground flex items-center gap-1"><Box className="h-3 w-3" />{listing.volume}</span>}
                {isRequest && <span className="text-xs text-muted-foreground flex items-center gap-1"><Box className="h-3 w-3" />{listing.volume}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {listing.address || "Экибастуз"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                {format(new Date(listing.createdAt), "d MMM", { locale: ru })}
              </p>
            </div>
          </div>

          {listing.description && (
            <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{listing.description}</p>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Комиссия: 5%</span>
            <div className="flex gap-2">
              {listing.userPhone && (
                <a href={`tel:${listing.userPhone}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                    <Phone className="h-3 w-3" />
                    Связаться
                  </Button>
                </a>
              )}
              <Button
                size="sm"
                variant={isRequest ? "outline" : "default"}
                className={isRequest ? "border-accent text-accent hover:bg-accent hover:text-white h-8 text-xs" : "bg-primary h-8 text-xs"}
                onClick={handleAction}
                disabled={isPending || isDisabled}
              >
                {isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                {isDisabled ? (isRequest ? "Закрыто" : "Недоступно") : isRequest ? "Откликнуться" : "Забронировать"}
              </Button>
            </div>
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

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addressFilter, setAddressFilter] = useState("all");

  const addressOptions = useMemo(() => {
    const used = new Set<string>();
    [...listings, ...requests].forEach(item => {
      const addr = (item as any).address;
      if (addr) {
        const street = EKIBASTUZ_STREETS.find(s => addr.toLowerCase().includes(s.toLowerCase().replace("ул. ", "").replace("пр. ", "")));
        if (street) used.add(street);
      }
    });
    return Array.from(used);
  }, [listings, requests]);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || (l.title || "").toLowerCase().includes(q) || l.wasteType.toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q) || (l.address || "").toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || l.wasteType === categoryFilter;
      const matchAddr = addressFilter === "all" || (l.address || "").toLowerCase().includes(addressFilter.toLowerCase().replace("ул. ", "").replace("пр. ", ""));
      return matchSearch && matchCat && matchAddr;
    });
  }, [listings, search, categoryFilter, addressFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q || (r.title || "").toLowerCase().includes(q) || r.wasteType.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q) || (r.address || "").toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || r.wasteType === categoryFilter;
      const matchAddr = addressFilter === "all" || (r.address || "").toLowerCase().includes(addressFilter.toLowerCase().replace("ул. ", "").replace("пр. ", ""));
      return matchSearch && matchCat && matchAddr;
    });
  }, [requests, search, categoryFilter, addressFilter]);

  const mapMarkers = [
    ...listings.map(l => ({ id: `l-${l.id}`, lat: l.lat, lng: l.lng, type: "sale" as const, title: l.title || l.wasteType })),
    ...requests.map(r => ({ id: `r-${r.id}`, lat: r.lat, lng: r.lng, type: "purchase" as const, title: r.title || r.wasteType })),
  ];

  const hasFilters = search || categoryFilter !== "all" || addressFilter !== "all";

  return (
    <Layout>
      <div className="bg-sidebar border-b border-border py-2.5">
        <div className="container max-w-screen-2xl px-4 md:px-8 flex flex-wrap gap-4 sm:gap-8 justify-center sm:justify-start text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Всего заявок</span>
            <span className="font-mono font-bold text-sm">{stats?.totalListings || 0} продаж / {stats?.totalRequests || 0} покупок</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Участников</span>
            <span className="font-mono font-bold text-sm">{stats?.totalUsers || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Топ отход</span>
            <span className="font-mono font-bold text-sm text-primary">{stats?.topWasteType || "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Активных</span>
            <span className="font-mono font-bold text-sm text-green-600">{stats?.activeListings || 0} активных</span>
          </div>
        </div>
      </div>

      <div className="container max-w-screen-2xl px-4 md:px-8 py-6 flex flex-col gap-8">
        {/* Map + CTAs */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-sm border border-border relative">
            <Map markers={mapMarkers} className="w-full h-[280px] sm:h-[420px] z-0" />
            <div className="absolute bottom-4 left-4 z-10 flex gap-2 bg-background/90 backdrop-blur p-2 rounded-lg shadow-md border border-border/50">
              <div className="flex items-center gap-1 text-xs font-medium">
                <div className="w-3 h-3 rounded-full bg-primary border border-white shadow-sm"></div> Продажа
              </div>
              <div className="flex items-center gap-1 text-xs font-medium ml-2">
                <div className="w-3 h-3 rounded-full bg-accent border border-white shadow-sm"></div> Покупка
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-5 flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold mb-1">Разместить объявление</h2>
                  <p className="text-sm text-muted-foreground">Добавьте свои отходы на биржу Экибастуза.</p>
                </div>
                <Link href="/listings/new">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-base h-12" size="lg">
                    Добавить отходы <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <div className="h-px bg-border"></div>
                <div>
                  <h2 className="text-lg font-bold mb-1">Ищете сырьё?</h2>
                  <p className="text-sm text-muted-foreground">Оставьте заявку — продавцы увидят вас на карте.</p>
                </div>
                <Link href="/requests/new">
                  <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-white text-base h-12" size="lg">
                    Разместить заявку <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Поиск: металл, пластик, шины..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {WASTE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={addressFilter} onValueChange={setAddressFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Все районы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все районы</SelectItem>
                {EKIBASTUZ_STREETS.slice(0, 15).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Найдено: {filteredListings.length} продаж, {filteredRequests.length} заявок</span>
              <button onClick={() => { setSearch(""); setCategoryFilter("all"); setAddressFilter("all"); }} className="underline text-primary hover:no-underline">
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Listings Feed */}
        <div className="max-w-4xl mx-auto w-full">
          <Tabs defaultValue="sell" className="w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold tracking-tight">Лента объявлений</h2>
              <TabsList className="bg-muted">
                <TabsTrigger value="sell" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Продают ({filteredListings.length})
                </TabsTrigger>
                <TabsTrigger value="buy" className="data-[state=active]:bg-accent data-[state=active]:text-white">
                  Покупают ({filteredRequests.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sell" className="flex flex-col gap-4 mt-0">
              {filteredListings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  {hasFilters ? "Нет объявлений по вашим фильтрам" : "Нет активных объявлений о продаже"}
                </div>
              ) : (
                <>
                  {filteredListings.slice(0, 3).map(l => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                  {filteredListings.length > 3 && (
                    <div className="my-2 p-4 bg-gradient-to-r from-orange-50 to-green-50 border border-border rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                      <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">Реклама</span>
                      Разместите свой бизнес на EkiEco — от 5 000 тг/нед.
                    </div>
                  )}
                  {filteredListings.slice(3).map(l => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="buy" className="flex flex-col gap-4 mt-0">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  {hasFilters ? "Нет заявок по вашим фильтрам" : "Нет активных заявок на покупку"}
                </div>
              ) : (
                filteredRequests.map(r => (
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
