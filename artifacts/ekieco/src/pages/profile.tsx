import { useState } from "react";
import { useGetMe, useGetListings, useGetPurchaseRequests } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StarRating } from "@/components/StarRating";
import { Box, Calendar, Phone, Activity, Pencil, Trash2, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getReviews, addReview, averageRating, type Review } from "@/lib/reviews";
import { useAuth } from "@/lib/auth";

function EditProfileDialog({ user, onSave }: { user: any; onSave: (name: string) => void }) {
  const [name, setName] = useState(user?.name || "");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />Редактировать
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Имя / Название предприятия</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Введите имя или название" />
          </div>
          <Button className="w-full bg-primary" onClick={() => onSave(name)}>Сохранить</Button>
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
    setText("");
    setRating(5);
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />Оставить отзыв
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Написать отзыв</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Оценка</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea
              placeholder="Расскажите о сотрудничестве..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <Button className="w-full bg-primary" onClick={handleSubmit} disabled={!text.trim()}>Опубликовать отзыв</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: listings = [] } = useGetListings();
  const { data: requests = [] } = useGetPurchaseRequests();
  const { isAuthenticated } = useAuth();
  const [profileName, setProfileName] = useState<string>("");
  const [reviewsRefresh, setReviewsRefresh] = useState(0);

  if (userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 py-20 text-destructive">Ошибка загрузки профиля</div>
      </Layout>
    );
  }

  const myListings = listings.filter(l => l.userId === user.id);
  const myRequests = requests.filter(r => r.userId === user.id);
  const reviews = getReviews(user.id);
  const avgRating = averageRating(reviews);

  const activityHistory = [
    { date: user.createdAt, action: "Регистрация на платформе" },
    ...myListings.map(l => ({ date: l.createdAt, action: `Опубликовано объявление: ${l.title || l.wasteType}` })),
    ...myRequests.map(r => ({ date: r.createdAt, action: `Создана заявка на покупку: ${r.title || r.wasteType}` })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayName = profileName || user.name || user.phone;

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Профиль предприятия</CardTitle>
                <CardDescription>Основная информация об аккаунте</CardDescription>
              </div>
              <EditProfileDialog
                user={{ ...user, name: displayName }}
                onSave={name => setProfileName(name)}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {(profileName || user.name) && (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Имя / Предприятие</p>
                    <p className="font-medium">{profileName || user.name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Номер телефона</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-full text-accent">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Дата регистрации</p>
                  <p className="font-medium">{format(new Date(user.createdAt), "d MMMM yyyy", { locale: ru })}</p>
                </div>
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-3 rounded-full text-amber-500">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Рейтинг</p>
                    <div className="flex items-center gap-2">
                      <StarRating value={Math.round(avgRating)} readonly size="sm" />
                      <span className="font-medium">{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({reviews.length} отзывов)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Активных объявлений</span>
                <span className="font-bold text-lg text-primary">{myListings.filter(l => l.status === "active").length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Продано сделок</span>
                <span className="font-bold text-lg">{user.soldCount || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Куплено сделок</span>
                <span className="font-bold text-lg">{user.purchasedCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Мои заявки</span>
                <span className="font-bold text-lg text-accent">{myRequests.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="mb-6 bg-muted flex-wrap h-auto">
            <TabsTrigger value="listings">Мои продажи ({myListings.length})</TabsTrigger>
            <TabsTrigger value="requests">Мои заявки ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы ({reviews.length})</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {myListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                У вас пока нет объявлений о продаже
              </div>
            ) : (
              myListings.map(listing => (
                <Card key={listing.id} className="overflow-hidden border-border shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold">{listing.title || listing.wasteType}</h3>
                        <Badge
                          variant={listing.status === "active" ? "default" : "secondary"}
                          className={listing.status === "active" ? "bg-primary text-xs" : "text-xs"}
                        >
                          {listing.status === "active" ? "Активно" : listing.status === "reserved" ? "Забронировано" : "Продано"}
                        </Badge>
                        {listing.isVip && (
                          <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded font-bold">ТОП</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Box className="h-3 w-3" /> {listing.volume}
                        {listing.address && <> · {listing.address}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(listing.createdAt), "dd.MM.yyyy", { locale: ru })}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        onClick={() => {
                          if (confirm("Удалить объявление?")) {
                            alert("В MVP удаление доступно через администратора. Объявление будет помечено для удаления.");
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                У вас пока нет заявок на покупку
              </div>
            ) : (
              myRequests.map(request => (
                <Card key={request.id} className="overflow-hidden border-border shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold">{request.title || `Куплю: ${request.wasteType}`}</h3>
                        <Badge variant="outline" className="border-accent text-accent text-xs">
                          {request.status === "open" ? "Открыта" : request.status === "responded" ? "Есть отклики" : "Закрыта"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Box className="h-3 w-3" /> {request.volume}
                        {request.address && <> · {request.address}</>}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(request.createdAt), "dd.MM.yyyy", { locale: ru })}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {reviews.length > 0 ? (
                  <>
                    <StarRating value={Math.round(avgRating)} readonly size="md" />
                    <span className="font-bold">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">{reviews.length} отзывов</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Пока нет отзывов</span>
                )}
              </div>
              {isAuthenticated && (
                <AddReviewDialog
                  targetUserId={user.id}
                  currentUserPhone={user.phone}
                  onAdded={() => setReviewsRefresh(r => r + 1)}
                />
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                Станьте первым, кто оставит отзыв
              </div>
            ) : (
              reviews.map(review => (
                <Card key={review.id} className="border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-sm">{review.authorPhone}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}
                        </p>
                      </div>
                      <StarRating value={review.rating} readonly size="sm" />
                    </div>
                    <p className="text-sm text-foreground/80">{review.text}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                {activityHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Нет активности</div>
                ) : (
                  <div className="divide-y divide-border">
                    {activityHistory.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-full mt-0.5 shrink-0">
                          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{item.action}</p>
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
