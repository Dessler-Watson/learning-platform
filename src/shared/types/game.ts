import type { ReactNode } from 'react';
export interface KeyState { forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean; }
export interface CameraConfig { distance: number; minDistance: number; maxDistance: number; phi: number; minPhi: number; maxPhi: number; theta: number; smoothSpeed: number; zoomSpeed: number; lookSpeed: number; }
export interface CharacterConfig { maxSpeed: number; acceleration: number; deceleration: number; jumpForce: number; rotationSpeed: number; }
export interface GameContextProps { children: ReactNode; }
