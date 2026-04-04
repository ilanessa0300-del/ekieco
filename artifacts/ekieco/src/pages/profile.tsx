import { useGetMe, useGetListings, useGetPurchaseRequests } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Box, Calendar, Phone, Activity } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Profile() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: listings = [], isLoading: listingsLoading } = useGetListings();
  const { data: requests = [], isLoading: requestsLoading } = useGetPurchaseRequests();

  if (userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1">Загрузка...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 text-destructive">Ошибка загрузки профиля</div>
      </Layout>
    );
  }

  // Filter listings and requests for the current user
  const myListings = listings.filter(l => l.userId === user.id);
  const myRequests = requests.filter(r => r.userId === user.id);
  
  // Fake some history for the MVP if empty
  const activityHistory = [
    { date: user.createdAt, action: "Регистрация на платформе" },
    ...(myListings.length > 0 ? [{ date: myListings[0].createdAt, action: "Опубликовано объявление о продаже" }] : []),
    ...(myRequests.length > 0 ? [{ date: myRequests[0].createdAt, action: "Создана заявка на покупку" }] : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 border-border shadow-sm">
            <CardHeader>
              <CardTitle>Профиль предприятия</CardTitle>
              <CardDescription>Основная информация о вашем аккаунте</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-full text-accent">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата регистрации</p>
                  <p className="font-medium">{format(new Date(user.createdAt), "d MMMM yyyy", { locale: ru })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Активных объявлений</span>
                <span className="font-bold text-lg">{myListings.filter(l => l.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Продано отходов</span>
                <span className="font-bold text-lg">{user.soldCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Куплено отходов</span>
                <span className="font-bold text-lg">{user.purchasedCount || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="mb-6 bg-muted">
            <TabsTrigger value="listings">Мои продажи</TabsTrigger>
            <TabsTrigger value="requests">Мои заявки</TabsTrigger>
            <TabsTrigger value="history">История активности</TabsTrigger>
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
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{listing.wasteType}</h3>
                        <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className={listing.status === 'active' ? "bg-primary" : ""}>
                          {listing.status === 'active' ? 'Активно' : listing.status === 'reserved' ? 'Забронировано' : 'Продано'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Box className="h-3 w-3" /> {listing.volume}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Создано: {format(new Date(listing.createdAt), "dd.MM.yyyy", { locale: ru })}
                      </p>
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
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{request.wasteType}</h3>
                        <Badge variant="outline" className="border-accent text-accent">
                          {request.status === 'open' ? 'Открыта' : request.status === 'responded' ? 'Есть отклики' : 'Закрыта'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Box className="h-3 w-3" /> {request.volume}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Создано: {format(new Date(request.createdAt), "dd.MM.yyyy", { locale: ru })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {activityHistory.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-start gap-4">
                      <div className="bg-muted p-2 rounded-full mt-1">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.date), "d MMMM yyyy, HH:mm", { locale: ru })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
