import { useState } from "react";
import { useGetMe, useGetListings, useGetPurchaseRequests } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StarRating } from "@/components/StarRating";
import { Box, Calendar, Phone, Activity, Pencil, Trash2, Star, MessageSquare, ShoppingCart, TrendingUp, Package, Lock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getReviews, addReview, averageRating } from "@/lib/reviews";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

function EditProfileDialog({ displayName, onSave }: { displayName: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(displayName);
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Pencil className="h-3.5 w-3.5" />Редактировать
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Редактировать профиль</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Имя / Название предприятия</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Введите имя или название" />
          </div>
          <Button className="w-full bg-primary" onClick={() => { onSave(name); setOpen(false); }}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddReviewDialog({ targetUserId, currentUserPhone, onAdded }: { targetUserId: number; currentUserPhone: string; onAdded: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    addReview({ authorPhone: currentUserPhone, targetUserId, rating, text });
    setText(""); setRating(5); setOpen(false); onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <MessageSquare className="h-3.5 w-3.5" />Написать отзыв
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Написать отзыв</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Оценка</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea placeholder="Расскажите о сотрудничестве..." value={text} onChange={e => setText(e.target.value)} className="min-h-[100px]" />
          </div>
          <Button className="w-full bg-primary" onClick={handleSubmit} disabled={!text.trim()}>Опубликовать</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotLoggedIn() {
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-20 px-4 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Личный кабинет</h1>
          <p className="text-muted-foreground">Войдите, чтобы увидеть свои объявления, статистику и отзывы</p>
        </div>
        <Link href="/auth">
          <Button className="bg-primary text-white text-base px-8 h-12">Войти / Зарегистрироваться</Button>
        </Link>
      </div>
    </Layout>
  );
}

export default function Profile() {
  const { data: user, isLoading } = useGetMe();
  const { data: listings = [] } = useGetListings();
  const { data: requests = [] } = useGetPurchaseRequests();
  const { isAuthenticated } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [reviewsKey, setReviewsKey] = useState(0);

  if (!isAuthenticated) return <NotLoggedIn />;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="text-muted-foreground animate-pulse">Загрузка профиля...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 py-20 text-destructive">
          Не удалось загрузить профиль
        </div>
      </Layout>
    );
  }

  const myListings = listings.filter(l => l.userId === user.id);
  const myRequests = requests.filter(r => r.userId === user.id);
  const reviews = getReviews(user.id);
  const avgRating = averageRating(reviews);
  const displayName = profileName || user.name || "";

  // Avatar initials
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : user.phone.replace(/\D/g, "").slice(-2);

  const activityHistory = [
    { date: user.createdAt, action: "Регистрация на платформе EkiEco" },
    ...myListings.map(l => ({ date: l.createdAt, action: `Опубликовано объявление: ${l.title || l.wasteType}` })),
    ...myRequests.map(r => ({ date: r.createdAt, action: `Заявка на покупку: ${r.title || r.wasteType}` })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">

        {/* Profile Header Card */}
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/80 to-primary" />
          <CardContent className="px-6 pb-6 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-primary font-bold text-2xl">
                  {initials}
                </div>
                <div className="pb-1">
                  <h1 className="text-xl font-bold leading-tight">
                    {displayName || "Предприятие Экибастуза"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{user.phone}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Зарегистрирован {format(new Date(user.createdAt), "d MMMM yyyy", { locale: ru })}
                    </span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <StarRating value={Math.round(avgRating)} readonly size="sm" />
                      <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({reviews.length} отзывов)</span>
                    </div>
                  )}
                </div>
              </div>
              <EditProfileDialog displayName={displayName} onSave={setProfileName} />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            label="Активных объявлений"
            value={user.activeListingsCount ?? myListings.filter(l => l.status === "active").length}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Продано сделок"
            value={user.soldCount ?? 0}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            icon={ShoppingCart}
            label="Куплено сделок"
            value={user.purchasedCount ?? 0}
            color="bg-accent/10 text-accent"
          />
          <StatCard
            icon={Star}
            label="Отзывов"
            value={reviews.length}
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings">
          <TabsList className="bg-muted flex-wrap h-auto gap-1">
            <TabsTrigger value="listings">Мои продажи ({myListings.length})</TabsTrigger>
            <TabsTrigger value="requests">Мои заявки ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы ({reviews.length})</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          {/* My Listings */}
          <TabsContent value="listings" className="space-y-3 mt-4">
            {myListings.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground bg-muted/30 rounded-lg border border-dashed flex flex-col items-center gap-3">
                <Package className="w-10 h-10 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">Объявлений пока нет</p>
                  <p className="text-sm">Добавьте первое объявление о продаже отходов</p>
                </div>
                <Link href="/listings/new">
                  <Button size="sm" className="bg-primary mt-1">+ Добавить объявление</Button>
                </Link>
              </div>
            ) : (
              myListings.map(listing => (
                <Card key={listing.id} className="border-border shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold">{listing.title || listing.wasteType}</h3>
                        <Badge
                          className={`text-xs ${listing.status === "active" ? "bg-primary" : listing.status === "reserved" ? "bg-amber-500" : "bg-muted-foreground"}`}
                        >
                          {listing.status === "active" ? "Активно" : listing.status === "reserved" ? "Забронировано" : "Продано"}
                        </Badge>
                        {listing.isVip && (
                          <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded font-bold">ТОП</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1"><Box className="h-3 w-3" />{listing.volume}</span>
                        {listing.address && <span>{listing.address}</span>}
                        <span>{format(new Date(listing.createdAt), "dd.MM.yyyy", { locale: ru })}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8 p-0"
                      onClick={() => { if (confirm("Удалить объявление?")) alert("В MVP-версии удаление через поддержку."); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* My Requests */}
          <TabsContent value="requests" className="space-y-3 mt-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground bg-muted/30 rounded-lg border border-dashed flex flex-col items-center gap-3">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">Заявок пока нет</p>
                  <p className="text-sm">Разместите заявку — продавцы свяжутся с вами</p>
                </div>
                <Link href="/requests/new">
                  <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white mt-1">+ Разместить заявку</Button>
                </Link>
              </div>
            ) : (
              myRequests.map(req => (
                <Card key={req.id} className="border-border shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold">{req.title || `Куплю: ${req.wasteType}`}</h3>
                        <Badge variant="outline" className="border-accent text-accent text-xs">
                          {req.status === "open" ? "Открыта" : req.status === "responded" ? "Есть отклики" : "Закрыта"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1"><Box className="h-3 w-3" />{req.volume}</span>
                        {req.address && <span>{req.address}</span>}
                        <span>{format(new Date(req.createdAt), "dd.MM.yyyy", { locale: ru })}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="space-y-3 mt-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {reviews.length > 0 ? (
                  <>
                    <StarRating value={Math.round(avgRating)} readonly />
                    <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">{reviews.length} отзывов</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Отзывов пока нет</span>
                )}
              </div>
              <AddReviewDialog
                targetUserId={user.id}
                currentUserPhone={user.phone}
                onAdded={() => setReviewsKey(k => k + 1)}
              />
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground bg-muted/30 rounded-lg border border-dashed flex flex-col items-center gap-2">
                <Star className="w-10 h-10 text-muted-foreground/40" />
                <p className="font-medium">Станьте первым, кто оставит отзыв</p>
              </div>
            ) : (
              reviews.map(review => (
                <Card key={review.id} className="border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-sm">{review.authorPhone}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}</p>
                      </div>
                      <StarRating value={review.rating} readonly size="sm" />
                    </div>
                    <p className="text-sm text-foreground/80">{review.text}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Activity History */}
          <TabsContent value="history" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                {activityHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Нет активности</div>
                ) : (
                  <div className="divide-y divide-border">
                    {activityHistory.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-3">
                        <div className="bg-muted rounded-full p-2 mt-0.5 shrink-0">
                          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(item.date), "d MMMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
