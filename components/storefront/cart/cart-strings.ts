import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * 购物车客户端组件的文案（纯对象，客户端安全，不含任何服务端依赖）。
 * 注意：服务端字典注释说"只在服务端运行"，购物车是客户端交互，
 * 所以这里单独放一份小的客户端文案，而不是把整份 JSON 打进浏览器包。
 */
const en = {
  addToCart: "Add to cart",
  cart: "Cart",
  closeCart: "Close cart",
  title: "Your cart",
  empty: "Your cart is empty.",
  browseProducts: "Browse products",
  quantity: "Quantity",
  decrease: "Decrease quantity",
  increase: "Increase quantity",
  remove: "Remove",
  subtotal: "Subtotal",
  note: "Shipping and taxes are calculated at checkout.",
  continueShopping: "Continue shopping",
  viewCart: "View cart",
  checkout: "Checkout",
  checkoutProcessing: "Processing…",
  checkoutError:
    "Could not start checkout. Please check your cart and try again.",
  stockError:
    "Some items in your cart don't have enough stock. Please adjust quantities.",
  clearCart: "Clear cart",
  itemCount: (n: number) => `${n} item${n === 1 ? "" : "s"}`,
};

const fr: typeof en = {
  addToCart: "Ajouter au panier",
  cart: "Panier",
  closeCart: "Fermer le panier",
  title: "Votre panier",
  empty: "Votre panier est vide.",
  browseProducts: "Voir les produits",
  quantity: "Quantité",
  decrease: "Diminuer la quantité",
  increase: "Augmenter la quantité",
  remove: "Retirer",
  subtotal: "Sous-total",
  note: "La livraison et les taxes seront calculées au paiement.",
  continueShopping: "Continuer mes achats",
  viewCart: "Voir le panier",
  checkout: "Commander",
  checkoutProcessing: "Traitement…",
  checkoutError:
    "Impossible de démarrer le paiement. Vérifiez votre panier et réessayez.",
  stockError:
    "Le stock est insuffisant pour certains articles. Veuillez ajuster les quantités.",
  clearCart: "Vider le panier",
  itemCount: (n: number) => `${n} article${n === 1 ? "" : "s"}`,
};

export type CartStrings = typeof en;

export function getCartStrings(locale: Locale): CartStrings {
  return locale === "fr" ? fr : en;
}
