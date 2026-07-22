import type { CameraConfig, CharacterConfig } from '@/shared/types/game';
export const CHARACTER: CharacterConfig = { maxSpeed: 8, acceleration: 12, deceleration: 10, jumpForce: 4, rotationSpeed: 8 };
export const CAMERA: CameraConfig = { distance: 5, minDistance: 2, maxDistance: 12, phi: Math.PI / 4, minPhi: 0.15, maxPhi: Math.PI / 2 - 0.1, theta: 0, smoothSpeed: 5, zoomSpeed: 2, lookSpeed: 0.003 };
export const WORLD = { gravity: -9.81, groundLevel: 0 };
export const ISLAND = { mainRadius: 10, mainHeight: 4, mainSegments: 32, smallRadius: 5, smallHeight: 2.5, smallSegments: 20, secondaryCount: 4 };
export const SKY = { topColor: '#1a1a2e', bottomColor: '#e8a87c', cloudColor: '#ffffff', cloudCount: 20 };
export const COLORS = { grass: '#7ec850', grassDark: '#5a9e3e', dirt: '#8b6b4a', dirtDark: '#6b4f35', stone: '#9e9e9e', stoneDark: '#6e6e6e', wood: '#a0785a', treeTrunk: '#8d6e4e', treeLeaves: '#5cb85c', water: '#4aa3df', particle: '#ffeebb', character: '#4fc3f7', skin: '#ffcc80', eye: '#333333', sun: '#ffd93d' };
