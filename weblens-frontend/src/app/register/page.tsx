"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegisterMutation } from "@/services/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  const [register, { isLoading, isError }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, name }).unwrap();
      router.push("/login");
    } catch {
      /* handled by isError flag */
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 font-sans px-4">
      <Card className="w-full max-w-md shadow-sm border-zinc-200/60">
        <CardHeader className="space-y-1 pb-6 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">Create an Account</CardTitle>
          <p className="text-sm text-zinc-500">
            Enter your details below to create your account
          </p>
        </CardHeader>
        
        <CardContent>
          {isError && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md mb-6">
              Registration failed. Email might already be in use.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900">Name</label>
              <Input 
                type="text" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900">Email</label>
              <Input 
                type="email" 
                required
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900">Password</label>
              <Input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-100 pt-6">
          <p className="text-sm text-zinc-600">
            Already have an account? <Link href="/login" className="text-zinc-900 font-semibold hover:underline underline-offset-4">Login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
