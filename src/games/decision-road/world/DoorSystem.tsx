'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useGameStore } from '@/stores/game.store';
import { DECISION_ROAD_CONFIG as CFG } from '@/games/decision-road/config';
import type { DoorChoice, GameQuestion } from '@/games/decision-road/types';

const PW = 8; const PH = 6; const SPACING = 25; const START_Z = 12;

export function DoorSystem() {
  const phase = useGameStore((s) => s.phase); const currentIndex = useGameStore((s) => s.currentQuestionIndex); const questions = useGameStore((s) => s.questions);
  if (phase === 'loading' || phase === 'intro' || phase === 'completed' || phase === 'results') return null;
  return (<group>{questions.map((q, i) => (<Station key={i} index={i} question={q} activeIndex={currentIndex} z={START_Z - i * SPACING} phase={phase} />))}</group>);
}

function Station({ index, question, activeIndex, z, phase }: { index: number; question: GameQuestion; activeIndex: number; z: number; phase: string }) {
  const triggered = useRef(false); const prevPhase = useRef(phase);
  useEffect(() => { if (phase === 'playing' && prevPhase.current !== 'playing') triggered.current = false; prevPhase.current = phase; }, [phase]);
  const isActive = index === activeIndex; const isCompleted = index < activeIndex;
  useFrame(() => { if (!isActive || triggered.current || (phase !== 'playing' && phase !== 'question')) return; const rb = characterRigidBody.current; if (!rb) return; const pz = rb.translation().z; if (Math.abs(pz - z) > 1.8) return; triggered.current = true; const side: DoorChoice = rb.translation().x < 0 ? 'A' : 'B'; const store = useGameStore.getState(); if (store.retryCount >= CFG.maxRetries) return; store.setPhase('question'); store.submitAnswer(side); const correct = side === question.correctAnswer; store.setPhase(correct ? 'correctFeedback' : 'incorrectFeedback'); if (!correct) store.setExplanation(question.explanation); });
  return (
    <group position={[0, PH / 2, z]}>
      <StationPanel side="A" option={question.optionA} state={isCompleted ? 'done' : isActive ? 'active' : 'locked'} phase={phase} isCorrect={isCompleted} />
      <StationPanel side="B" option={question.optionB} state={isCompleted ? 'done' : isActive ? 'active' : 'locked'} phase={phase} isCorrect={isCompleted} />
      {isCompleted && (<RigidBody type="fixed" colliders={false}><CuboidCollider args={[PW, PH / 2, 0.4]} /></RigidBody>)}
    </group>
  );
}

type PanelState = 'active' | 'locked' | 'done';
function StationPanel({ side, option, state, phase, isCorrect }: { side: DoorChoice; option: string; state: PanelState; phase: string; isCorrect: boolean }) {
  const xOff = side === 'A' ? -PW / 2 : PW / 2;
  let color: string; let opacity: number;
  if (state === 'done') { color = '#4CAF50'; opacity = 0.5; } else if (state === 'locked') { color = '#888'; opacity = 0.5; } else { color = side === 'A' ? '#FF4B4B' : '#4BC94B'; opacity = 1; }
  const selectedDoor = useGameStore((s) => s.selectedDoor);
  if (state === 'active' && phase === 'correctFeedback' && selectedDoor === side) opacity = 0.3;
  return (
    <group position={[xOff, 0, 0]}>
      {state === 'active' && (<RigidBody type="fixed" colliders={false}><CuboidCollider args={[PW / 2, PH / 2, 0.5]} sensor /></RigidBody>)}
      <mesh><planeGeometry args={[PW, PH]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={opacity} /></mesh>
      {(state === 'active' || state === 'done') && (<Text position={[0, 0.3, 0.01]} fontSize={state === 'done' ? 0.2 : 0.26} maxWidth={PW - 1.2} color="#FFFFFF" anchorX="center" anchorY="middle" textAlign="center" fontWeight="700" outlineColor="#000" outlineWidth={0.02}>{state === 'done' ? '✓ COMPLETADO' : option.toUpperCase()}</Text>)}
      <Text position={[0, -2.2, 0.01]} fontSize={0.5} color={color} anchorX="center" anchorY="middle" fontWeight="900" outlineColor="#000" outlineWidth={0.04}>{side}</Text>
      {state === 'active' && phase === 'correctFeedback' && selectedDoor === side && (<mesh position={[0, 0, 0.02]}><planeGeometry args={[PW + 1, PH + 1]} /><meshBasicMaterial color="#FFD700" side={THREE.DoubleSide} transparent opacity={0.45} /></mesh>)}
    </group>
  );
}
