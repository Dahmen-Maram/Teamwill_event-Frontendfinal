"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"

function TeamwillLogo() {
  return (
    <group position={[0, 0, 0]}>
      {/* Logo principal - forme stylisée */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.5, 0.2]} />
        <meshStandardMaterial 
          color="#16a34a" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Accent décoratif */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color="#84cc16" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* Éléments décoratifs */}
      <mesh position={[-0.8, -0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      
      <mesh position={[0.8, -0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  )
}

function EventsBadge() {
  return (
    <group position={[0, -1.5, 0]}>
      <mesh>
        <boxGeometry args={[1.5, 0.4, 0.1]} />
        <meshStandardMaterial 
          color="#84cc16" 
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* Points décoratifs */}
      <mesh position={[-0.5, 0, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <mesh position={[0.5, 0, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

export function HeroScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <spotLight 
          position={[0, 5, 0]} 
          angle={0.3} 
          penumbra={1} 
          intensity={1} 
          castShadow 
        />
        
        {/* Logo Teamwill au centre */}
        <TeamwillLogo />
        <EventsBadge />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  )
}
