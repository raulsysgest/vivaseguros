import React from "react";
import { Metadata } from "next";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { DailyStatsChart } from "@/components/dashboard/daily-stats-chart";

export const metadata: Metadata = {
  title: "Visão Geral - Painel do Agente Viva Seguros",
  description: "Métricas e gráfico diário de simulações, apólices e propostas.",
};

export default function DashboardPage() {
  const metrics = [
    {
      title: "Total de Simulacoes",
      value: "9",
      icon: FileText,
      bgColor: "bg-blue-50/90",
      textColor: "text-blue-600",
    },
    {
      title: "Propostas Pendentes",
      value: "1",
      icon: Clock,
      bgColor: "bg-amber-50/90",
      textColor: "text-amber-600",
    },
    {
      title: "Apolices",
      value: "1",
      icon: CheckCircle2,
      bgColor: "bg-emerald-50/90",
      textColor: "text-emerald-600",
    },
    {
      title: "Propostas Rejeitadas",
      value: "0",
      icon: XCircle,
      bgColor: "bg-red-50/90",
      textColor: "text-red-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Grade de 4 Cards de Métricas (Cantos elegantes rounded-lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {metrics.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="bg-white border border-zinc-200/80 p-4.5 sm:p-5 flex items-center gap-4 rounded-lg shadow-xs hover:border-zinc-300 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-lg ${item.bgColor} ${item.textColor} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-5.5 h-5.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-500 truncate">
                  {item.title}
                </span>
                <span className="text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
                  {item.value}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Card do Gráfico com ApexCharts (Bordas rounded-lg) */}
      <Card className="bg-white border border-zinc-200/80 p-5 sm:p-6 rounded-lg shadow-xs">
        {/* Cabeçalho do Gráfico */}
        <div className="mb-2">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
            Grafico diario de simulacoes, apolices e propostas pendentes
          </h2>
        </div>

        {/* Componente ApexCharts */}
        <DailyStatsChart />
      </Card>
    </div>
  );
}
