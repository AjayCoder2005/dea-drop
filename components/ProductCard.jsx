"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Trash2,
  ExternalLink,
  BarChart2,
  Bell,
  BellOff,
  Check,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { deleteProduct, setTargetPrice } from "@/app/actions";
import PriceChart from "./PriceChart";

const ProductCard = ({ product }) => {
  const [deleting, setDeleting] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput] = useState(product.target_price || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this product?")) return;

    try {
      setDeleting(true);
      await deleteProduct(product.id);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete:", err);
      setDeleting(false);
    }
  };

  const handleSetTarget = async () => {
    try {
      setSaving(true);
      await setTargetPrice(product.id, parseFloat(targetInput));
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
        setShowTargetInput(false);
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error("Failed to set target:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTarget = async () => {
    await setTargetPrice(product.id, null);
    setTargetInput("");
    window.location.reload();
  };

  const currencyMap = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const currency = currencyMap[product.currency] || "₹"; // default to ₹

  const isTargetMet =
    product.target_price &&
    product.current_price <= product.target_price;

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">

      {/* IMAGE */}
      {product.image_url && (
        <div className="relative w-full h-48 bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
          />

          {isTargetMet && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white">
              🎯 Target Reached
            </Badge>
          )}
        </div>
      )}

      {/* HEADER */}
      <CardHeader className="pb-1 pt-3 px-4">
        <h3 className="font-semibold text-sm line-clamp-2">
          {product.name}
        </h3>

        {product.store && (
          <p className="text-xs text-muted-foreground">
            {product.store}
          </p>
        )}
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="px-4 pb-3 flex flex-col gap-2 flex-1">

        {/* PRICE */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-orange-500">
            {currency} {product.current_price?.toLocaleString("en-IN")}
          </span>
        </div>

        {/* TARGET DISPLAY */}
        {product.target_price && (
          <div
            className={`flex justify-between text-xs px-2 py-1 rounded ${
              isTargetMet
                ? "bg-green-50 text-green-700"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            <span>
              🎯 Target: {currency}
              {parseFloat(product.target_price).toLocaleString("en-IN")}
            </span>

            <button
              onClick={handleRemoveTarget}
              className="ml-2 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )}

        {/* TARGET INPUT */}
        {showTargetInput && (
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder={`Target price (${currency})`}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="h-8 text-sm"
            />

            <Button
              size="sm"
              onClick={handleSetTarget}
              disabled={saving || !targetInput}
              className="h-8 bg-orange-500 text-white"
            >
              {saved ? <Check className="w-4 h-4" /> : saving ? "..." : "Set"}
            </Button>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-between mt-auto pt-1 flex-wrap gap-2">

          <div className="flex gap-2 flex-wrap">

            {/* FIXED VISIT BUTTON */}
            {product.url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Product
                </a>
              </Button>
            )}

            {/* CHART BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart2 className="w-4 h-4 mr-1" />
              {showChart ? "Hide Chart" : "Show Chart"}
            </Button>

            {/* ALERT BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTargetInput(!showTargetInput)}
            >
              {product.target_price ? (
                <BellOff className="w-4 h-4 mr-1" />
              ) : (
                <Bell className="w-4 h-4 mr-1" />
              )}
              {product.target_price ? "Edit Alert" : "Set Alert"}
            </Button>

          </div>

          {/* DELETE BUTTON */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

        </div>

      </CardContent>

      {/* CHART */}
      {showChart && (
        <CardFooter className="pt-0">
          <PriceChart productId={product.id} />
        </CardFooter>
      )}

    </Card>
  );
};

export default ProductCard;