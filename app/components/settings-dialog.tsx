import type { GameSettings } from "~/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}) {
  function update(partial: Partial<GameSettings>) {
    onSettingsChange({ ...settings, ...partial });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Table Rules</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="h17" className="text-sm text-white/90">
              Dealer hits soft 17
            </Label>
            <Switch
              id="h17"
              checked={settings.dealerHitsSoft17}
              onCheckedChange={(v) => update({ dealerHitsSoft17: v })}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <Label htmlFor="das" className="text-sm text-white/90">
              Double after split
            </Label>
            <Switch
              id="das"
              checked={settings.doubleAfterSplit}
              onCheckedChange={(v) => update({ doubleAfterSplit: v })}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <Label htmlFor="sur" className="text-sm text-white/90">
              Late surrender
            </Label>
            <Switch
              id="sur"
              checked={settings.surrenderAllowed}
              onCheckedChange={(v) => update({ surrenderAllowed: v })}
            />
          </div>

          <Separator className="bg-gray-700" />

          <div className="flex items-center justify-between">
            <Label className="text-sm text-white/90">Blackjack pays</Label>
            <Select
              value={settings.blackjackPayout}
              onValueChange={(v) =>
                update({ blackjackPayout: v as "3:2" | "6:5" })
              }
            >
              <SelectTrigger className="w-20 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                <SelectItem value="3:2">3:2</SelectItem>
                <SelectItem value="6:5">6:5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
