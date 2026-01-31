"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Clientes",
  loans: "Empréstimos",
  payments: "Pagamentos",
  reports: "Relatórios",
  settings: "Configurações",
  new: "Novo",
  edit: "Editar",
};

export function Header() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const href = "/" + pathSegments.slice(0, index + 1).join("/");
            const label = breadcrumbMap[segment] || segment;

            return (
              <React.Fragment key={segment}>
                <BreadcrumbItem>
                  {!isLast ? (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
