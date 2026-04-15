import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 次のミノ（常に棒ミノ）を表示するパネル。
 * StickStack では棒ミノしか存在しないため、表示は常に固定。
 */
export default function NextPiece() {
  return (
    <Card className="rounded-[2rem] border-4 border-[#ffcf6a] bg-[#2a1d45] shadow-[0_0_0_4px_#5d448a,0_16px_40px_rgba(0,0,0,0.5)]">
      <CardHeader>
        <CardTitle className="font-mono text-xl tracking-wide text-[#ffe9a3]">
          NEXT
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="inline-grid grid-cols-4 gap-0 rounded-lg border-2 border-[#4e357c] bg-[#120b22] p-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 w-6 border-2 bg-cyan-300 border-cyan-100 shadow-[inset_2px_2px_0_rgba(255,255,255,0.18)]"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
