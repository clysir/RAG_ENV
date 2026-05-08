"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ErrorBox,
  Input,
  Label,
  SecondaryButton,
  SuccessBox,
} from "@/components/ui";
import { loginApi, registerApi, setToken } from "@/lib/api";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!username.trim()) {
        throw new Error("请输入用户名");
      }

      if (!password.trim()) {
        throw new Error("请输入密码");
      }

      if (mode === "register") {
        if (!email.trim()) {
          throw new Error("请输入邮箱");
        }

        await registerApi({
          username,
          email,
          password,
        });

        setSuccess("注册成功，请登录。");
        setMode("login");
        return;
      }

      const res = await loginApi({
        username,
        password,
      });

      setToken(res.access_token);
      router.push("/kb");
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <Card className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "登录" : "注册"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            登录后可以管理知识库、上传文档、测试 Query 和 Chat。
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>用户名</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名，不是邮箱"
            />
          </div>

          {mode === "register" && (
            <div>
              <Label>邮箱</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
              />
            </div>
          )}

          <div>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
        </div>

        <ErrorBox>{error}</ErrorBox>
        <SuccessBox>{success}</SuccessBox>

        <Button disabled={loading} onClick={handleSubmit} className="w-full">
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </Button>

        <SecondaryButton
          className="w-full"
          onClick={() => {
            setError("");
            setSuccess("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
        </SecondaryButton>
      </Card>
    </main>
  );
}
