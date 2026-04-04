import { useState } from "react";
import { useLocation } from "wouter";
import { useRequestAuthCode, useVerifyAuthCode } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);
  
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const requestAuthCode = useRequestAuthCode();
  const verifyAuthCode = useVerifyAuthCode();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await requestAuthCode.mutateAsync({ data: { phone } });
      if (res.success) {
        setStep("code");
        if (res.devCode) {
          setDevCode(res.devCode);
          toast({
            title: "Код для входа",
            description: `Ваш код: ${res.devCode} (Только для демо)`,
            duration: 10000,
          });
        }
      } else {
        toast({
          title: "Ошибка",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить код",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 4) {
      toast({
        title: "Ошибка",
        description: "Введите 4-значный код",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await verifyAuthCode.mutateAsync({ data: { phone, code } });
      login(res.token);
      toast({
        title: "Успешно",
        description: "Вы вошли в систему",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Неверный код",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">
              Вход в платформу
            </CardTitle>
            <CardDescription className="text-center">
              {step === "phone" 
                ? "Введите номер телефона для входа или регистрации" 
                : "Введите код из SMS"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+7 (700) 000-00-00" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={requestAuthCode.isPending}
                >
                  {requestAuthCode.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Получить код
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код из SMS</Label>
                  <Input 
                    id="code" 
                    type="text" 
                    placeholder="0000" 
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                
                {devCode && (
                  <div className="p-3 bg-muted rounded-md text-sm text-center border border-border">
                    <span className="text-muted-foreground">Демо-код: </span>
                    <strong className="font-mono text-lg">{devCode}</strong>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={verifyAuthCode.isPending}
                >
                  {verifyAuthCode.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Войти
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep("phone")}
                  disabled={verifyAuthCode.isPending}
                >
                  Изменить номер
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
