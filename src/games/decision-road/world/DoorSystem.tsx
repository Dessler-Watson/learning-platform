'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { characterRigidBody } from '@/shared/refs/characterRef';
import { useGameStore } from '@/stores/game.store';
import type { DoorChoice, GameQuestion } from '@/games/decision-road/types';
import { gameAudio } from '@/shared/lib/gameAudio';

const PW = 7.5;
const PH = 5.5;
const SPACING = 25;
const START_Z = 12;
const RADIUS = 0.4;
const BACK_WALL_OFFSET = 3;

export function DoorSystem() {
  const phase = useGameStore((s) => s.phase);
  const currentIndex = useGameStore((s) => s.currentQuestionIndex);
  const questions = useGameStore((s) => s.questions);
  if (phase === 'loading' || phase === 'intro' || phase === 'completed' || phase === 'results') return null;
  return (
    <group>
      {questions.map((q, i) => (
        <Station key={i} index={i} question={q} activeIndex={currentIndex} z={START_Z - i * SPACING} phase={phase} />
      ))}
    </group>
  );
}

function Station({ index, question, activeIndex, z, phase }: { index: number; question: GameQuestion; activeIndex: number; z: number; phase: string }) {
  const triggered = useRef(false);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (phase === 'playing' && prevPhase.current !== 'playing') triggered.current = false;
    prevPhase.current = phase;
  }, [phase]);

  const isActive = index === activeIndex;
  const isCompleted = index < activeIndex || (isActive && (phase === 'correctFeedback' || phase === 'incorrectFeedback' || phase === 'finishing'));
  const showBackWall = index < activeIndex || (isActive && phase === 'finishing');

  useFrame(() => {
    if (!isActive || triggered.current || (phase !== 'playing' && phase !== 'question')) return;
    const rb = characterRigidBody.current;
    if (!rb) return;
    const pz = rb.translation().z;
    if (Math.abs(pz - z) > 1.8) return;
    triggered.current = true;
    const side: DoorChoice = rb.translation().x < 0 ? 'A' : 'B';
    const store = useGameStore.getState();
    gameAudio.decisionSelect();
    store.setPhase('question');
    void (async () => {
      // Paso 4: el resultado correcto/incorrecto viene del servidor en modo sala.
      const res = await useGameStore.getState().submitAnswer(side);
      const correct = res?.correct ?? false;
      useGameStore.getState().setPhase(correct ? 'correctFeedback' : 'incorrectFeedback');
      if (correct) { gameAudio.decisionCorrect(); } else { gameAudio.decisionIncorrect(); }
      if (!correct) useGameStore.getState().setExplanation(question.explanation);
    })();
  });

  return (
    <group position={[0, PH / 2 + 0.5, z]}>
      <StationPanel side="A" option={question.optionA} state={isCompleted ? 'done' : isActive ? 'active' : 'locked'} phase={phase} isCorrect={isCompleted} />
      <StationPanel side="B" option={question.optionB} state={isCompleted ? 'done' : isActive ? 'active' : 'locked'} phase={phase} isCorrect={isCompleted} />

      {showBackWall && (
        <RigidBody type="fixed" colliders={false} position={[0, 0, BACK_WALL_OFFSET]}>
          <CuboidCollider args={[PW, PH / 2, 0.3]} />
        </RigidBody>
      )}
    </group>
  );
}

type PanelState = 'active' | 'locked' | 'done';

function Diamond({ position, size, color, opacity }: { position: [number, number, number]; size: number; color: string; opacity: number }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 4]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function StationPanel({ side, option, state, phase, isCorrect }: { side: DoorChoice; option: string; state: PanelState; phase: string; isCorrect: boolean }) {
  const xOff = side === 'A' ? -PW / 2 - 0.15 : PW / 2 + 0.15;
  const selectedDoor = useGameStore((s) => s.selectedDoor);

  let mainColor: string;
  let glowColor: string;
  let opacity: number;

  if (state === 'done') {
    mainColor = '#4CAF50';
    glowColor = '#81C784';
    opacity = 0.5;
  } else if (state === 'locked') {
    mainColor = '#B0BEC5';
    glowColor = '#CFD8DC';
    opacity = 0.3;
  } else {
    if (side === 'A') {
      mainColor = '#EF5350';
      glowColor = '#FF8A80';
    } else {
      mainColor = '#4DB6AC';
      glowColor = '#80CBC4';
    }
    opacity = 0.92;
  }

  if (state === 'active' && phase === 'correctFeedback' && selectedDoor === side) opacity = 0.3;

  const isActive = state === 'active';
  const isDone = state === 'done';
  const showContent = isActive || isDone;

  return (
    <group position={[xOff, 0, 0]}>
      {isActive && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[PW / 2, PH / 2, 0.5]} sensor />
        </RigidBody>
      )}

      <RoundedBox args={[PW, PH, 0.15]} radius={RADIUS} smoothness={4}>
        <meshStandardMaterial
          color={mainColor}
          transparent
          opacity={opacity}
          roughness={0.35}
          metalness={0.02}
          emissive={glowColor}
          emissiveIntensity={isActive ? 0.15 : 0.05}
          side={THREE.DoubleSide}
        />
      </RoundedBox>

      {isActive && (
        <RoundedBox args={[PW + 0.3, PH + 0.3, 0.01]} radius={RADIUS + 0.1} smoothness={4} position={[0, 0, -0.1]}>
          <meshBasicMaterial color={glowColor} transparent opacity={0.2} side={THREE.DoubleSide} />
        </RoundedBox>
      )}

      {showContent && (
        <>
          <Diamond position={[PW / 2 - 0.7, PH / 2 - 0.7, 0.1]} size={0.5} color="#ffffff" opacity={0.15} />
          <Diamond position={[-PW / 2 + 0.7, PH / 2 - 0.7, 0.1]} size={0.35} color="#ffffff" opacity={0.1} />
          <Diamond position={[PW / 2 - 1.0, -PH / 2 + 0.8, 0.1]} size={0.3} color="#ffffff" opacity={0.08} />
        </>
      )}

      {showContent && (
        <group position={[0, 1.2, 0.12]}>
          <mesh>
            <circleGeometry args={[0.85, 32]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {showContent && (
        <Text position={[0, 1.2, 0.14]} fontSize={0.9} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="900" outlineColor="#000000" outlineWidth={0.06} letterSpacing={0.05}>
          {side}
        </Text>
      )}

      {showContent && (
        <Text
          position={[0, -0.3, 0.1]}
          fontSize={isDone ? 0.24 : 0.3}
          maxWidth={PW - 1.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          fontWeight="800"
          outlineColor="#000000"
          outlineWidth={0.035}
          letterSpacing={0.03}
          lineHeight={1.2}
        >
          {isDone ? '\u2714 COMPLETADO' : option.toUpperCase()}
        </Text>
      )}

      {isActive && phase === 'correctFeedback' && selectedDoor === side && (
        <RoundedBox args={[PW + 0.8, PH + 0.8, 0.01]} radius={RADIUS + 0.2} smoothness={4} position={[0, 0, 0.15]}>
          <meshBasicMaterial color="#FFD700" transparent opacity={0.4} side={THREE.DoubleSide} />
        </RoundedBox>
      )}
    </group>
  );
}
