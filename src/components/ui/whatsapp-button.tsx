"use client";

import { Button } from "@/components/ui/button";
import { WhatsAppService } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";
import { ElementType } from "react";

interface WhatsAppButtonProps {
    phone: string;
    message: string;
    label?: string;
    variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
    icon?: ElementType;
}

export function WhatsAppButton({
    phone,
    message,
    label = "WhatsApp",
    variant = "default",
    className,
    size = "default",
    icon: Icon = MessageCircle,
}: WhatsAppButtonProps) {
    const handleClick = () => {
        const link = WhatsAppService.getLink(phone, message);
        window.open(link, "_blank");
    };

    return (
        <Button variant={variant} className={className} size={size} onClick={handleClick}>
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}
