import {useEffect,useState} from 'react';
export function useStudyNow(){const [now,setNow]=useState(Date.now);useEffect(()=>{const wake=()=>setNow(Date.now());const timer=setInterval(wake,30000);document.addEventListener('visibilitychange',wake);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',wake);};},[]);return now;}
