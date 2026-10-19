"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

// Carregamento dinâmico do ApexCharts sem SSR (necessário no Next.js)
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 flex items-center justify-center text-xs text-zinc-400 bg-zinc-50/50 rounded-lg animate-pulse">
      Carregando gráfico de estatísticas...
    </div>
  ),
});

export function DailyStatsChart() {
  // Dados diários de estatísticas
  const series = [
    {
      name: "Apolices",
      data: [0, 1, 0, 0, 1, 0, 1],
    },
    {
      name: "Simulacoes",
      data: [2, 3, 1, 4, 2, 3, 2],
    },
    {
      name: "Propostas Pendentes",
      data: [0, 1, 0, 1, 0, 1, 0],
    },
  ];

  const options: ApexOptions = {
    theme: {
      mode: "light",
    },
    chart: {
      type: "line",
      height: 310,
      background: "#ffffff",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
      fontFamily: "inherit",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 500,
      },
    },
    colors: [
      "#10B981", // Apolices (Verde)
      "#C85A27", // Simulacoes (Terracota Viva Seguros)
      "#F59E0B", // Propostas Pendentes (Âmbar)
    ],
    stroke: {
      curve: "smooth",
      width: [3, 3, 3],
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: [
        "08/10",
        "09/10",
        "10/10",
        "11/10",
        "12/10",
        "13/10",
        "Hoje",
      ],
      axisBorder: {
        show: true,
        color: "#E2E8F0",
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#64748B",
          fontSize: "12px",
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      title: {
        text: "Quantidade",
        style: {
          color: "#94A3B8",
          fontSize: "11px",
          fontWeight: 600,
        },
      },
      min: 0,
      forceNiceScale: true,
      labels: {
        formatter: (val) => Math.floor(val).toString(),
        style: {
          colors: "#64748B",
          fontSize: "12px",
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "12px",
      fontWeight: 600,
      labels: {
        colors: "#334155",
      },
      markers: {
        shape: "square",
        size: 7,
      },
      itemMargin: {
        horizontal: 16,
        vertical: 8,
      },
    },
    tooltip: {
      theme: "light",
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `${val} registros`,
      },
    },
  };

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="line" height={310} />
    </div>
  );
}
