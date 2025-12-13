import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const LanguageSwitch = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleToggle = (checked: boolean) => {
    setLanguage(checked ? "sw" : "en");
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="language-switch" className="text-sm text-muted-foreground">
        EN
      </Label>
      <Switch
        id="language-switch"
        checked={language === "sw"}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="language-switch" className="text-sm text-muted-foreground">
        SW
      </Label>
    </div>
  );
};
