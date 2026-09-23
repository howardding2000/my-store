import Stripe from "stripe";

/**
 * 服务端 Stripe 客户端（懒加载单例）。
 *
 * 安全红线：
 * - STRIPE_SECRET_KEY 只从服务端环境变量读，绝不进浏览器 bundle、
 *   绝不写进源码、绝不出现在日志里。
 * - 这个模块只能被服务端代码（Route Handler / Server Component）import，
 *   客户端组件引用它会在构建时把密钥逻辑带入浏览器包——禁止。
 * - 懒加载是为了 `next build` 时不因缺少密钥而崩溃（路由收集阶段会求值模块）。
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to .env.local (never commit it).",
      );
    }
    client = new Stripe(key);
  }
  return client;
}
