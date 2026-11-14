import React,{createContext,useContext} from 'react';
import type {CatCollection} from './CatWardrobeModal';
export const CosmeticsContext=createContext<{collection:CatCollection;setCollection:React.Dispatch<React.SetStateAction<CatCollection>>}|null>(null);
export function useCosmetics(){const value=useContext(CosmeticsContext);if(!value)throw Error('Cosmetics provider missing');return value;}
