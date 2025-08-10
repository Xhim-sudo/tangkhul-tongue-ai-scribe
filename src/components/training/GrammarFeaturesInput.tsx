import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type GrammarMap = Record<string, any>;

interface GrammarFeaturesInputProps {
  partOfSpeech: string;
  value: GrammarMap;
  onChange: (val: GrammarMap) => void;
}

const GrammarFeaturesInput: React.FC<GrammarFeaturesInputProps> = ({ partOfSpeech, value, onChange }) => {
  const setField = (key: string, val: any) => {
    onChange({ ...(value || {}), [key]: val });
  };

  // Basic field sets per POS to keep UI simple and focused
  if (partOfSpeech === 'verb') {
    return (
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tense</label>
          <Select value={value?.tense || ''} onValueChange={(v) => setField('tense', v)}>
            <SelectTrigger className="border-orange-200">
              <SelectValue placeholder="Select tense" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="future">Future</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Aspect</label>
          <Select value={value?.aspect || ''} onValueChange={(v) => setField('aspect', v)}>
            <SelectTrigger className="border-orange-200">
              <SelectValue placeholder="Select aspect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="continuous">Continuous</SelectItem>
              <SelectItem value="perfect">Perfect</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Function/Usage</label>
          <Input
            placeholder="imperative, interrogative, habitual..."
            value={value?.function || ''}
            onChange={(e) => setField('function', e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
      </div>
    );
  }

  if (partOfSpeech === 'noun') {
    return (
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Number</label>
          <Select value={value?.number || ''} onValueChange={(v) => setField('number', v)}>
            <SelectTrigger className="border-orange-200">
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="singular">Singular</SelectItem>
              <SelectItem value="plural">Plural</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Gender</label>
          <Select value={value?.gender || ''} onValueChange={(v) => setField('gender', v)}>
            <SelectTrigger className="border-orange-200">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None/Not applicable</SelectItem>
              <SelectItem value="masculine">Masculine</SelectItem>
              <SelectItem value="feminine">Feminine</SelectItem>
              <SelectItem value="neuter">Neuter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Function/Usage</label>
          <Input
            placeholder="subject, object, address, title..."
            value={value?.function || ''}
            onChange={(e) => setField('function', e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
      </div>
    );
  }

  if (partOfSpeech === 'adjective' || partOfSpeech === 'adverb') {
    return (
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Degree</label>
          <Select value={value?.degree || ''} onValueChange={(v) => setField('degree', v)}>
            <SelectTrigger className="border-orange-200">
              <SelectValue placeholder="Select degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="comparative">Comparative</SelectItem>
              <SelectItem value="superlative">Superlative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Function/Usage</label>
          <Input
            placeholder="modifier of noun, manner of action..."
            value={value?.function || ''}
            onChange={(e) => setField('function', e.target.value)}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>
      </div>
    );
  }

  // Default compact input for phrases/sentences/unknown
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">Function/Usage</label>
        <Input
          placeholder="greeting, question, request, formal/casual..."
          value={value?.function || ''}
          onChange={(e) => setField('function', e.target.value)}
          className="border-orange-200 focus:border-orange-400"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Register/Notes</label>
        <Input
          placeholder="formal, informal, polite, ceremonial..."
          value={value?.register || ''}
          onChange={(e) => setField('register', e.target.value)}
          className="border-orange-200 focus:border-orange-400"
        />
      </div>
    </div>
  );
};

export default GrammarFeaturesInput;
