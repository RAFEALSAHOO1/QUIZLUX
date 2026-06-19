import React from "react";

interface SkeuomorphicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "muted" | "danger" | "glass";
}

export default function SkeuomorphicButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
}: SkeuomorphicButtonProps) {
  
  // Custom skeuomorphic styles for QuizLux
  const baseStyle = "relative inline-flex items-center justify-center font-semibold text-sm transition-all duration-150 transform select-none rounded-xl border border-t-[1.5px] border-b-[3.5px] active:translate-y-[2px] active:border-b-[1.5px] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 cursor-pointer overflow-hidden";
  
  let variantStyle = "";

  switch (variant) {
    case "primary":
      // Luxury Purple with high-fidelity metallic border adjustments
      variantStyle = `
        bg-gradient-to-b from-[#8B85FF] to-[#5146FF] 
        text-white 
        border-t-[#B7B3FF] border-x-[#5146FF] border-b-[#2D21C7]
        shadow-[0_4px_12px_rgba(108,99,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]
        hover:from-[#9D98FF] hover:to-[#6359FF]
        active:shadow-[0_2px_4px_rgba(108,99,255,0.2)]
      `;
      break;
    case "secondary":
      // Neon Cyan and Metallic teal offsets
      variantStyle = `
        bg-gradient-to-b from-[#33E5FF] to-[#0099B8] 
        text-[#0F172A] 
        border-t-[#85EFFF] border-x-[#0099B8] border-b-[#006073]
        shadow-[0_4px_12px_rgba(0,212,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]
        hover:from-[#5CEBFF] hover:to-[#00A9CC]
        active:shadow-[0_2px_4px_rgba(0,212,255,0.15)]
      `;
      break;
    case "accent":
      // Gold and Metallic Amber details
      variantStyle = `
        bg-gradient-to-b from-[#FFF07C] to-[#E5A900] 
        text-[#1E1100] 
        border-t-[#FFFBCC] border-x-[#E5A900] border-b-[#996D00]
        shadow-[0_4px_12px_rgba(255,215,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]
        hover:from-[#FFF4A3] hover:to-[#FFBD00]
        active:shadow-[0_2px_4px_rgba(255,215,0,0.15)]
      `;
      break;
    case "danger":
      variantStyle = `
        bg-gradient-to-b from-[#FF7E7E] to-[#E02424] 
        text-white 
        border-t-[#FFA1A1] border-x-[#E02424] border-b-[#9B1C1C]
        shadow-[0_4px_12px_rgba(224,36,36,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]
        hover:from-[#FF9E9E] hover:to-[#F03030]
        active:shadow-[0_2px_4px_rgba(224,36,36,0.15)]
      `;
      break;
    case "glass":
      // Highly reflective tactile premium glass button
      variantStyle = `
        bg-[#ffffff15] backdrop-blur-md
        text-[#FFFFFF]
        border-t-[#ffffff30] border-x-[#ffffff15] border-b-[#00000050]
        shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.15)]
        hover:bg-[#ffffff22] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]
        active:shadow-[0_2px_4px_rgba(0,0,0,0.1)]
      `;
      break;
    case "muted":
    default:
      // Sleek Metallic Slate
      variantStyle = `
        bg-gradient-to-b from-[#334155] to-[#1E293B] 
        text-slate-300 
        border-t-[#475569] border-x-[#1E293B] border-b-[#0F172A]
        shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]
        hover:from-[#475569] hover:to-[#334155]
        active:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
      `;
  }

  return (
    <button
      id={`btn-${crypto.randomUUID().slice(0, 8)}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Light sheen sweeping reflection animation */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
    </button>
  );
}
