"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type HandleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (handle: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
};

export function HandleModal({ open, onOpenChange, onSubmit, loading, error }: HandleModalProps) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sanitized = value.trim();
    if (!sanitized) {
      setLocalError("Handle is required");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(sanitized.replace(/^@/, ""))) {
      setLocalError("Use 3-15 letters, numbers, or underscores");
      return;
    }
    setLocalError(null);
    await onSubmit(sanitized);
    setValue("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setValue("");
          setLocalError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pick your handle</DialogTitle>
          <DialogDescription>
            Choose a unique @name to appear on leaderboards. Letters, numbers, and underscores only.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Input
              autoFocus
              value={value}
              placeholder="@MajnuFan99"
              onChange={(event) => {
                setValue(event.target.value);
                setLocalError(null);
              }}
              disabled={loading}
            />
            {localError ? (
              <p className="text-xs font-semibold text-red">{localError}</p>
            ) : error ? (
              <p className="text-xs font-semibold text-red">{error}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Skip for now
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Handle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
