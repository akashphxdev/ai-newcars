import { formatSinglePrice } from "@/lib/format";
import { buildSwatchBackground } from "@/lib/colorSwatch";
import type { CarDetailColor } from "@/features/cars/car.types";

// Plain display list — name, swatch, price delta. Colour -> photo
// switching lives in the hero gallery above (CarModelGallery), not here.
export default function CarModelColours({ colors }: { colors: CarDetailColor[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {colors.map((color) => (
        <div key={color.id} className="flex flex-col items-center gap-2">
          <span className="size-9 rounded-full border border-border" style={{ background: buildSwatchBackground(color.shades) }} />
          <p className="text-[11.5px] font-medium text-ink">{color.colorName}</p>
          {color.additionalCost && Number(color.additionalCost) > 0 && (
            <p className="text-[10.5px] text-muted">+{formatSinglePrice(color.additionalCost)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
