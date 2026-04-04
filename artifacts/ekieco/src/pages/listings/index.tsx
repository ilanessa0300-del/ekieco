import { useState, useMemo } from "react";
import { useGetListings, useGetPurchaseRequests, useReserveListing, useRespondToPurchaseRequest, getGetListingsQueryKey, getGetPurchaseRequestsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Box, Search, X, Plus, Loader2, Phone } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { WASTE_TYPES, EKIBASTUZ_STREETS } from "@/lib/ekibastuz-streets";
import { Link } from "wouter";

function ListingCard({ listing, isRequest = false }: { listing: any; isRequest?: boolean }) {
  const isVip = !isRequest && listing.isVip;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reserveListing = useReserveListing();
  const respondRequest = useRespondToPurchaseRequest();
  const { isAuthenticated } = useAuth();

  const handleAction = async () => {
    if (!isAuthenticated) {
      toast({ title: "Необходима авторизация", description: "Войдите в систему", variant: "destructive" });
      return;
    }
    try {
      if (isRequest) {
        await respondRequest.mutateAsync({ id: listing.id });
        queryClient.invalidateQueries({ queryKey: getGetPurchaseRequestsQueryKey() });
        toast({ title: "Отклик отправлен" });
      } else {
        await reserveListing.mutateAsync({ id: listing.id });
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        toast({ title: "Забронировано" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось выполнить действие", variant: "destructive" });
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
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        {!isRequest && listing.photoUrl && (
          <div className="sm:w-24 h-24 sm:h-auto rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img src={listing.photoUrl} alt="Отходы" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight">
                {listing.title || (isRequest ? `Куплю: ${listing.wasteType}` : `Продам: ${listing.wasteType}`)}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className={isRequest ? "text-accent border-accent text-xs" : "text-primary border-primary text-xs"}>
                  {listing.wasteType}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Box className="h-3 w-3" />{listing.volume}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{listing.address || "Экибастуз"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">{format(new Date(listing.createdAt), "d MMM", { locale: ru })}</p>
          </div>
          {listing.description && <p className="text-sm text-foreground/70 mt-1.5 line-clamp-2">{listing.description}</p>}
          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Комиссия: 5%</span>
            <div className="flex gap-2">
              {listing.userPhone && (
                <a href={`tel:${listing.userPhone}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                    <Phone className="h-3 w-3" />Связаться
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
                {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {isDisabled ? (isRequest ? "Закрыто" : "Недоступно") : isRequest ? "Откликнуться" : "Забронировать"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ListingsPage() {
  const { data: listings = [] } = useGetListings();
  const { data: requests = [] } = useGetPurchaseRequests();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addressFilter, setAddressFilter] = useState("all");

  const filteredListings = useMemo(() => listings.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || (l.title || "").toLowerCase().includes(q) || l.wasteType.toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q) || (l.address || "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || l.wasteType === categoryFilter;
    const matchAddr = addressFilter === "all" || (l.address || "").toLowerCase().includes(addressFilter.toLowerCase().replace("ул. ", "").replace("пр. ", ""));
    return matchSearch && matchCat && matchAddr;
  }), [listings, search, categoryFilter, addressFilter]);

  const filteredRequests = useMemo(() => requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.title || "").toLowerCase().includes(q) || r.wasteType.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q) || (r.address || "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || r.wasteType === categoryFilter;
    const matchAddr = addressFilter === "all" || (r.address || "").toLowerCase().includes(addressFilter.toLowerCase().replace("ул. ", "").replace("пр. ", ""));
    return matchSearch && matchCat && matchAddr;
  }), [requests, search, categoryFilter, addressFilter]);

  const hasFilters = search || categoryFilter !== "all" || addressFilter !== "all";

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Объявления</h1>
            <p className="text-sm text-muted-foreground">Биржа вторсырья Экибастуза</p>
          </div>
          <div className="flex gap-2">
            <Link href="/listings/new">
              <Button size="sm" className="bg-primary gap-1.5">
                <Plus className="h-4 w-4" />Добавить
              </Button>
            </Link>
            <Link href="/requests/new">
              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white gap-1.5">
                <Plus className="h-4 w-4" />Заявка
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Поиск по ключевым словам..."
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
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {WASTE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={addressFilter} onValueChange={setAddressFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Все адреса" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все адреса</SelectItem>
                {EKIBASTUZ_STREETS.slice(0, 20).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Найдено: {filteredListings.length} продаж, {filteredRequests.length} заявок</span>
              <button onClick={() => { setSearch(""); setCategoryFilter("all"); setAddressFilter("all"); }} className="underline text-primary">
                Сбросить
              </button>
            </div>
          )}
        </div>

        <Tabs defaultValue="sell" className="w-full">
          <TabsList className="mb-5 bg-muted">
            <TabsTrigger value="sell" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Продают ({filteredListings.length})
            </TabsTrigger>
            <TabsTrigger value="buy" className="data-[state=active]:bg-accent data-[state=active]:text-white">
              Покупают ({filteredRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sell" className="space-y-4 mt-0">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                {hasFilters ? "Нет объявлений по вашим фильтрам" : "Нет объявлений о продаже"}
              </div>
            ) : (
              filteredListings.map(l => <ListingCard key={l.id} listing={l} />)
            )}
          </TabsContent>

          <TabsContent value="buy" className="space-y-4 mt-0">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                {hasFilters ? "Нет заявок по вашим фильтрам" : "Нет заявок на покупку"}
              </div>
            ) : (
              filteredRequests.map(r => <ListingCard key={r.id} listing={r} isRequest />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
