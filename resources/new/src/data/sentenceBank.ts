import type { LevelData } from "../types/game";
import levels from "./allLevels.json";
import kaoyan from './kaoyan/kaoyan_long_sentences.json';
import {createKaoyanLevels} from '../../shared/kaoyan-levels.mjs';
export const SENTENCE_BANK: LevelData[] = [...levels,...createKaoyanLevels(kaoyan,levels.length)] as LevelData[];
