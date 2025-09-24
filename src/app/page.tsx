"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Chrome, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from "firebase/auth";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z
    .string()
    .min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);

    setIsLoading(true);

    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const { email, password } = values;
    try {
      let userCredential;
      if (activeTab === "login") {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
      handleLoginSuccess(userCredential.user);
    } catch (error: any) {
      if (error?.code === "auth/email-already-in-use") {
        alert("Este e-mail já está em uso. Tente fazer login.");
      } else if (
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/user-not-found" ||
        error?.code === "auth/invalid-credential"
      ) {
        alert("E-mail ou senha incorretos.");
      } else {
        console.error("Erro de autenticação:", error);
        alert("Ocorreu um erro. Tente novamente.");
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      handleLoginSuccess(result.user);
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      if (error?.code === "auth/popup-blocked") {
        alert("O pop-up foi bloqueado. Permita pop-ups e tente novamente.");
      } else {
        alert("Erro ao autenticar com Google. Tente novamente.");
      }
      setIsLoading(false);
    }
  };

  const formFields = (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="seu@email.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950">
      <motion.div
        className="w-full h-full flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <Card
          className="w-full min-h-screen rounded-none border-none shadow-none flex flex-col justify-center
                     sm:max-w-[420px] sm:min-h-fit sm:h-auto sm:rounded-2xl sm:border sm:border-slate-700/50 sm:shadow-2xl
                     bg-black/40 backdrop-blur-xl text-white shadow-green-500/10"
        >
          <CardHeader className="items-center text-center p-6 pb-4">
            <motion.div
              className="w-full flex justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <Image
                src="/Cofre-Forte.png"
                alt="Cofre Forte Logo"
                width={60}
                height={60}
                className="mb-4"
              />
            </motion.div>

            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-8 w-8 text-green-400" />
              <CardTitle className="text-3xl font-bold tracking-tighter whitespace-nowrap bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                Cofre Forte
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2">
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center gap-4 text-center py-8"
                >
                  <Avatar className="h-20 w-20 border-2 border-green-400">
                    <AvatarImage src={user.photoURL || ""} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="mt-2">
                    <p className="font-bold text-lg">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-slate-400">
                      Login efetuado com sucesso!
                    </p>
                  </div>

                  {}
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-4 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-green-400 to-cyan-400 h-1.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "linear" }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 mt-2 animate-pulse">
                    Preparando seu dashboard...
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                      setActiveTab(value as "login" | "register");
                      form.reset();
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                      <TabsTrigger value="login">Entrar</TabsTrigger>
                      <TabsTrigger value="register">Registrar</TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 mt-4"
                      >
                        <div className="space-y-4">{formFields}</div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full !mt-6"
                        >
                          {isLoading
                            ? "Aguarde..."
                            : activeTab === "login"
                            ? "Entrar"
                            : "Criar Conta"}
                        </Button>
                      </form>
                    </Form>

                    {}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black/40 px-2 text-slate-400">
                          Ou
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full gap-2 bg-transparent"
                    >
                      <Chrome className="h-5 w-5" /> Google
                    </Button>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
