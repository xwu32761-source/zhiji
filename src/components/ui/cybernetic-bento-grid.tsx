"use client";

import { useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoItemProps {
  className?: string;
  children: ReactNode;
  colSpan?: string;
  rowSpan?: string;
}

function BentoItem({ className, children, colSpan, rowSpan }: BentoItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);
    };

    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={itemRef}
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors duration-300",
        "hover:bg-white/10",
        "before:pointer-events-none before:absolute before:-inset-px before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300",
        "hover:before:opacity-100 before:bg-[radial-gradient(600px_circle_at_var(--mouse-x,_50%)_var(--mouse-y,_50%),rgba(255,255,255,0.06),transparent_40%)]",
        colSpan, rowSpan,
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CyberneticBentoGridProps {
  className?: string;
  title?: string;
  items?: {
    title: string;
    description: string;
    colSpan?: string;
    rowSpan?: string;
    children?: ReactNode;
  }[];
}

export function CyberneticBentoGrid({
  className,
  title = "Core Features",
  items = [],
  ...props
}: CyberneticBentoGridProps) {
  const defaultItems: CyberneticBentoGridProps["items"] = [
    {
      title: "实时分析",
      description: "监控应用性能，获取秒级数据流与可视化展示。",
      colSpan: "col-span-2",
      rowSpan: "row-span-2",
    },
    {
      title: "全球 CDN",
      description: "无论用户身在何处，内容闪电般送达。",
    },
    {
      title: "安全认证",
      description: "企业级身份验证与用户管理，开箱即用。",
    },
    {
      title: "自动备份",
      description: "冗余自动备份，数据始终安全。",
      rowSpan: "row-span-2",
    },
    {
      title: "无服务器函数",
      description: "无需管理服务器即可运行后端代码，无限扩展。",
      colSpan: "col-span-2",
    },
    {
      title: "CLI 工具",
      description: "一行命令管理整个基础设施。",
    },
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <div className={cn("w-full max-w-6xl", className)} {...props}>
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayItems.map((item, i) => (
          <BentoItem
            key={i}
            colSpan={item.colSpan}
            rowSpan={item.rowSpan}
          >
            <h3 className="text-xl font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              {item.description}
            </p>
            {item.children}
          </BentoItem>
        ))}
      </div>
    </div>
  );
}
