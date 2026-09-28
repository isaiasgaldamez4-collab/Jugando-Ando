"""
=============================================================================
NEON SHURIKEN: CYBERPUNK PROTOCOL - [juego_premium.py]
-----------------------------------------------------------------------------
Motor: Python Arcade (OpenGL 2D Framework a 60 FPS estables)
Características Avanzadas:
  - Pantalla completa / ventana reescalable con botón y tecla de Pausa (P / ESC).
  - Modo 1 Jugador (Solo) y Modo 2 Jugadores (Amigos en el mismo teclado y mandos).
  - 4 Mundos Temáticos con nuevos obstáculos: Minas EMP, Rayos Láser, Plataformas Móviles y Torretas.
  - Tienda de 6 Ciber-Personajes desbloqueables con estadísticas únicas.
  - Sistema de Nombres de Jugadores y Tablón de Ranking persistente en JSON.
  - Cámara Lerp Fluida, Sistema de Partículas Vectoriales y HUD de Neón Comercial.
=============================================================================
"""

import math
import random
import sys
import json
import os
from typing import List, Optional, Tuple, Dict, Any
import arcade

# =============================================================================
# CONSTANTES DE PANTALLA Y PALETA DE COLORES CYBERPUNK
# =============================================================================
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
SCREEN_TITLE = "Neon Shuriken: Cyberpunk Protocol - Python Arcade 60 FPS"

COLOR_BG = (10, 10, 22)             # Fondo Megaciudad #0a0a16
COLOR_CYAN = (0, 245, 212)           # Neón Cyan P1 (#00f5d4)
COLOR_MAGENTA = (255, 0, 85)         # Neón Magenta P2 (#ff0055)
COLOR_YELLOW = (255, 230, 0)         # Neón Amarillo Eléctrico
COLOR_RED_LASER = (255, 23, 68)      # Rojo Alerta Proyectil / Láser
COLOR_PURPLE = (180, 0, 255)         # Púrpura reactor
COLOR_DARK_BUILDING = (15, 17, 33)   # Superficie de plataformas
COLOR_BUILDING_OUTLINE = (38, 44, 76)
COLOR_WHITE = (255, 255, 255)

# Archivo de persistencia para el Tablón de Ranking
RANKING_FILE = "cyberpunk_ranking.json"

# =============================================================================
# DEFINICIÓN DE PERSONAJES
# =============================================================================
CHARACTERS = {
    "kage": {
        "name": "Kage",
        "title": "Ciber-Ninja",
        "max_hp": 100,
        "speed": 7.5,
        "jump": 15.5,
        "color": COLOR_CYAN,
        "cost": 0,
        "desc": "Equilibrado, katana de alta frecuencia y dash estándar."
    },
    "valkyrie": {
        "name": "Valkyrie",
        "title": "Ángel Neón",
        "max_hp": 90,
        "speed": 8.2,
        "jump": 17.5,
        "color": (255, 100, 200),
        "cost": 150,
        "desc": "Alas de plasma con salto potenciado y velocidad superior."
    },
    "ronin": {
        "name": "Ronin-X",
        "title": "Androide Pesado",
        "max_hp": 150,
        "speed": 6.8,
        "jump": 14.5,
        "color": (255, 150, 0),
        "cost": 300,
        "desc": "Armadura blindada con 150 HP y tajo de katana sísmico."
    },
    "ghost": {
        "name": "Ghost",
        "title": "Hacker Fantasma",
        "max_hp": 85,
        "speed": 8.8,
        "jump": 16.0,
        "color": (160, 255, 100),
        "cost": 500,
        "desc": "Dash cuántico con intangibilidad frente a lásers y proyectiles."
    },
    "nova": {
        "name": "Nova",
        "title": "Velocista de Plasma",
        "max_hp": 95,
        "speed": 9.2,
        "jump": 16.2,
        "color": (255, 240, 50),
        "cost": 750,
        "desc": "Máxima velocidad horizontal y enfriamiento de dash ultra rápido."
    },
    "cypher": {
        "name": "Cypher",
        "title": "Mercenario Cibernético",
        "max_hp": 110,
        "speed": 7.8,
        "jump": 15.8,
        "color": (100, 220, 255),
        "cost": 1000,
        "desc": "Imán aumentado para recolectar cripto-monedas a distancia."
    }
}

# =============================================================================
# DEFINICIÓN DE MUNDOS Y MAPAS
# =============================================================================
WORLDS = [
    {
        "id": 1,
        "name": "Azoteas de Neo-Kyoto",
        "theme": "Tejados y lluvia digital",
        "length": 4800,
        "accent": COLOR_CYAN,
        "bg_dark": (10, 10, 22),
        "obstacles": "Drones de vigilancia estándar y abismos de neón."
    },
    {
        "id": 2,
        "name": "Reactor Subterráneo Plasma",
        "theme": "Núcleo de energía térmica",
        "length": 6800,
        "accent": COLOR_MAGENTA,
        "bg_dark": (20, 8, 20),
        "obstacles": "Rayos láser intermitentes y plataformas móviles flotantes."
    },
    {
        "id": 3,
        "name": "Bastión Megacorporativo",
        "theme": "Defensa automatizada élite",
        "length": 8800,
        "accent": COLOR_YELLOW,
        "bg_dark": (14, 18, 28),
        "obstacles": "Torretas fijas de disparo rápido y plataformas colapsables."
    },
    {
        "id": 4,
        "name": "Autopista Orbital Neón",
        "theme": "Vacío espacial y propulsión",
        "length": 10500,
        "accent": COLOR_PURPLE,
        "bg_dark": (8, 6, 18),
        "obstacles": "Minas de proximidad EMP, velocidad extrema y saltos largos."
    }
]


# =============================================================================
# GESTOR DEL TABLÓN DE RANKING PERSISTENTE (NUNCA SE BORRA)
# =============================================================================
class RankingManager:
    """Gestiona la carga y almacenamiento seguro de récords en archivo JSON."""
    @staticmethod
    def load_rankings() -> List[Dict[str, Any]]:
        default_rankings = [
            {"name": "NeoKage", "score": 14200, "world": "Mundo 4: Autopista Orbital", "mode": "1P Solo", "character": "Ghost", "coins": 48},
            {"name": "Valkyrie-7", "score": 11500, "world": "Mundo 3: Bastión Megacorp", "mode": "1P Solo", "character": "Valkyrie", "coins": 35},
            {"name": "DuoCyber (Alex & Sam)", "score": 9800, "world": "Mundo 2: Reactor Plasma", "mode": "2P Amigos", "character": "Kage & Ronin-X", "coins": 52},
            {"name": "RoninSlash", "score": 8400, "world": "Mundo 2: Reactor Plasma", "mode": "1P Solo", "character": "Ronin-X", "coins": 26},
            {"name": "SpeedRunner99", "score": 6200, "world": "Mundo 1: Neo-Kyoto", "mode": "1P Solo", "character": "Nova", "coins": 20},
        ]
        if not os.path.exists(RANKING_FILE):
            try:
                with open(RANKING_FILE, "w", encoding="utf-8") as f:
                    json.dump(default_rankings, f, indent=2, ensure_ascii=False)
            except Exception:
                pass
            return default_rankings

        try:
            with open(RANKING_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return sorted(data, key=lambda x: x.get("score", 0), reverse=True)
        except Exception:
            pass
        return default_rankings

    @staticmethod
    def add_score(name: str, score: int, world_name: str, mode: str, character_name: str, coins: int):
        records = RankingManager.load_rankings()
        new_entry = {
            "name": name.strip() or "Ciber-Corredor",
            "score": score,
            "world": world_name,
            "mode": mode,
            "character": character_name,
            "coins": coins
        }
        records.append(new_entry)
        records = sorted(records, key=lambda x: x.get("score", 0), reverse=True)[:50]
        try:
            with open(RANKING_FILE, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[ERROR GUARDANDO RANKING]: {e}")


# =============================================================================
# SISTEMA DE PARTÍCULAS
# =============================================================================
class NeonParticle:
    def __init__(self, x: float, y: float, vx: float, vy: float, color: Tuple[int, int, int], size: float = 3.5, lifetime: float = 0.5):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.size = size
        self.initial_size = size
        self.lifetime = lifetime
        self.max_lifetime = lifetime
        self.dead = False

    def update(self, dt: float):
        self.x += self.vx
        self.y += self.vy
        self.vx *= 0.94
        self.vy *= 0.94
        self.lifetime -= dt
        if self.lifetime <= 0:
            self.dead = True
        else:
            pct = max(0.0, self.lifetime / self.max_lifetime)
            self.size = max(0.5, self.initial_size * pct)

    def draw(self):
        pct = max(0.0, min(1.0, self.lifetime / self.max_lifetime))
        alpha = int(pct * 255)
        r, g, b = self.color[:3]
        arcade.draw_rectangle_filled(self.x, self.y, self.size, self.size, (r, g, b, alpha))


class ParticleEmitter:
    def __init__(self):
        self.particles: List[NeonParticle] = []

    def update(self, dt: float):
        for p in self.particles:
            p.update(dt)
        self.particles = [p for p in self.particles if not p.dead]

    def draw(self):
        for p in self.particles:
            p.draw()

    def emit_sparks(self, x: float, y: float, count: int = 12, color: Tuple[int, int, int] = COLOR_CYAN):
        for _ in range(count):
            angle = random.uniform(0, math.pi * 2)
            spd = random.uniform(2.0, 7.0)
            self.particles.append(NeonParticle(
                x, y, math.cos(angle) * spd, math.sin(angle) * spd, color,
                size=random.uniform(2.5, 4.5), lifetime=random.uniform(0.2, 0.45)
            ))

    def emit_explosion(self, x: float, y: float, color: Tuple[int, int, int] = COLOR_RED_LASER):
        for _ in range(35):
            angle = random.uniform(0, math.pi * 2)
            spd = random.uniform(3.0, 10.0)
            self.particles.append(NeonParticle(
                x, y, math.cos(angle) * spd, math.sin(angle) * spd, color,
                size=random.uniform(3.0, 6.0), lifetime=random.uniform(0.3, 0.6)
            ))


# =============================================================================
# ENTIDADES Y OBSTÁCULOS AVANZADOS
# =============================================================================
class FloatingPlatform:
    """Plataformas fijas, móviles y colapsables con bordes neón."""
    def __init__(self, x: float, y: float, width: float, height: float, accent: Tuple[int, int, int] = COLOR_CYAN,
                 moving: bool = False, move_range: float = 120.0, collapsible: bool = False):
        self.base_x = x
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.accent = accent
        self.moving = moving
        self.move_range = move_range
        self.move_phase = random.uniform(0, math.pi * 2)
        self.collapsible = collapsible
        self.collapsed = False
        self.collapse_timer = 0.0
        self.standing_on = False

    @property
    def left(self) -> float:
        return self.x - self.width / 2

    @property
    def right(self) -> float:
        return self.x + self.width / 2

    @property
    def top(self) -> float:
        return self.y + self.height / 2

    @property
    def bottom(self) -> float:
        return self.y - self.height / 2

    def update(self, dt: float):
        if self.moving:
            self.move_phase += dt * 1.8
            self.x = self.base_x + math.sin(self.move_phase) * self.move_range

        if self.collapsible and self.standing_on and not self.collapsed:
            self.collapse_timer += dt
            if self.collapse_timer >= 0.8:
                self.collapsed = True

    def draw(self):
        if self.collapsed:
            return

        # Parpadeo si está a punto de colapsar
        if self.collapsible and self.standing_on:
            if int(self.collapse_timer * 15) % 2 == 0:
                col = (255, 23, 68)
            else:
                col = self.accent
        else:
            col = self.accent

        arcade.draw_rectangle_filled(self.x, self.y, self.width, self.height, COLOR_DARK_BUILDING)
        arcade.draw_rectangle_outline(self.x, self.y, self.width, self.height, COLOR_BUILDING_OUTLINE, 1.5)
        # Borde superior neón
        arcade.draw_line(self.left, self.top, self.right, self.top, col, 4)


class LaserHazard:
    """Rayos láser intermitentes que se activan y desactivan periódicamente."""
    def __init__(self, x: float, y_bottom: float, y_top: float, interval: float = 2.2):
        self.x = x
        self.y_bottom = y_bottom
        self.y_top = y_top
        self.interval = interval
        self.timer = random.uniform(0, interval)
        self.is_active = True

    def update(self, dt: float):
        self.timer += dt
        if self.timer >= self.interval:
            self.timer = 0.0
            self.is_active = not self.is_active

    def draw(self):
        # Emisores en los extremos
        arcade.draw_rectangle_filled(self.x, self.y_bottom, 16, 12, (40, 45, 65))
        arcade.draw_rectangle_filled(self.x, self.y_top, 16, 12, (40, 45, 65))

        if self.is_active:
            # Haz de láser mortal rojo
            arcade.draw_line(self.x, self.y_bottom, self.x, self.y_top, (255, 23, 68, 80), 8)
            arcade.draw_line(self.x, self.y_bottom, self.x, self.y_top, (255, 23, 68), 3)
            arcade.draw_line(self.x, self.y_bottom, self.x, self.y_top, (255, 255, 255), 1)
        else:
            # Modo advertencia (haz tenue titilante)
            if int(self.timer * 8) % 2 == 0:
                arcade.draw_line(self.x, self.y_bottom, self.x, self.y_top, (255, 23, 68, 40), 1)


class EMPMine:
    """Mina de proximidad flotante que detona al acercarse."""
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.base_y = y
        self.phase = random.uniform(0, math.pi * 2)
        self.triggered = False
        self.detonate_timer = 0.0
        self.dead = False

    def update(self, dt: float, px: float, py: float, particles: ParticleEmitter) -> bool:
        if self.dead:
            return False
        self.phase += dt * 3.0
        self.y = self.base_y + math.sin(self.phase) * 6.0

        dist = math.hypot(px - self.x, py - self.y)
        if dist < 65.0 and not self.triggered:
            self.triggered = True

        if self.triggered:
            self.detonate_timer += dt
            if self.detonate_timer >= 0.45:
                self.dead = True
                particles.emit_explosion(self.x, self.y, COLOR_RED_LASER)
                return dist < 85.0  # Daño infligido por explosión
        return False

    def draw(self):
        if self.dead:
            return
        col = COLOR_RED_LASER if self.triggered else (200, 150, 0)
        size = 14 + (math.sin(self.phase * 2) * 2 if self.triggered else 0)
        arcade.draw_circle_filled(self.x, self.y, size, (25, 20, 35))
        arcade.draw_circle_filled(self.x, self.y, size * 0.6, col)
        # Resplandor
        arcade.draw_circle_outline(self.x, self.y, size + 4, (col[0], col[1], col[2], 120), 2)


class CryptoCoin:
    """Monedas Cripto de Neón recolectables para comprar personajes."""
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.base_y = y
        self.collected = False
        self.phase = random.uniform(0, math.pi * 2)

    def update(self, dt: float):
        self.phase += dt * 4.0
        self.y = self.base_y + math.sin(self.phase) * 5.0

    def draw(self):
        if self.collected:
            return
        arcade.draw_circle_filled(self.x, self.y, 8, COLOR_YELLOW)
        arcade.draw_circle_filled(self.x, self.y, 5, (255, 255, 200))
        arcade.draw_circle_outline(self.x, self.y, 11, (255, 230, 0, 100), 2)


# =============================================================================
# JUGADOR CYBER-NINJA (SOPORTE P1 Y P2)
# =============================================================================
class PlayerRunner:
    def __init__(self, player_id: int, char_key: str, name: str, x: float, y: float):
        self.id = player_id
        self.char_data = CHARACTERS.get(char_key, CHARACTERS["kage"])
        self.name = name.strip() or f"Jugador {player_id}"
        self.x = x
        self.y = y
        self.vx = 0.0
        self.vy = 0.0
        self.width = 28.0
        self.height = 46.0
        self.facing = 1
        self.is_on_ground = False
        self.jumps_left = 2

        self.max_hp = self.char_data["max_hp"]
        self.hp = self.max_hp
        self.display_hp = float(self.hp)
        self.speed = self.char_data["speed"]
        self.jump_power = self.char_data["jump"]
        self.color = self.char_data["color"]

        self.is_dashing = False
        self.dash_timer = 0.0
        self.dash_cooldown = 0.0
        self.is_attacking = False
        self.attack_timer = 0.0

        self.combo_count = 0
        self.combo_timer = 0.0
        self.score = 0
        self.coins = 0
        self.invulnerable_timer = 0.0
        self.dead = False
        self.reached_goal = False

    @property
    def left(self) -> float:
        return self.x - self.width / 2

    @property
    def right(self) -> float:
        return self.x + self.width / 2

    @property
    def top(self) -> float:
        return self.y + self.height / 2

    @property
    def bottom(self) -> float:
        return self.y - self.height / 2

    def trigger_jump(self, particles: ParticleEmitter):
        if self.jumps_left > 0 and not self.is_dashing and not self.dead:
            self.vy = self.jump_power
            self.jumps_left -= 1
            self.is_on_ground = False
            particles.emit_sparks(self.x, self.bottom, count=8, color=COLOR_YELLOW)

    def trigger_dash(self, particles: ParticleEmitter):
        if self.dash_cooldown <= 0 and not self.is_dashing and not self.dead:
            self.is_dashing = True
            self.dash_timer = 0.22
            self.dash_cooldown = 0.70
            self.vy = 0.0
            self.vx = self.facing * 22.0
            particles.emit_sparks(self.x, self.y, count=16, color=self.color)
            self.score += 50

    def trigger_attack(self, particles: ParticleEmitter):
        if not self.is_attacking and not self.dead:
            self.is_attacking = True
            self.attack_timer = 0.18
            particles.emit_sparks(self.x + self.facing * 20, self.y, count=6, color=self.color)

    def take_damage(self, amount: int, particles: ParticleEmitter):
        if self.invulnerable_timer <= 0 and not self.is_dashing and not self.dead:
            self.hp = max(0, self.hp - amount)
            self.invulnerable_timer = 1.0
            particles.emit_sparks(self.x, self.y, count=20, color=COLOR_RED_LASER)
            if self.hp <= 0:
                self.dead = True

    def update(self, dt: float, platforms: List[FloatingPlatform], particles: ParticleEmitter):
        if self.dead:
            return

        if self.invulnerable_timer > 0:
            self.invulnerable_timer -= dt
        if self.dash_cooldown > 0:
            self.dash_cooldown -= dt
        if self.attack_timer > 0:
            self.attack_timer -= dt
            if self.attack_timer <= 0:
                self.is_attacking = False

        if self.display_hp > self.hp:
            self.display_hp -= (self.display_hp - self.hp) * 0.15

        if self.is_dashing:
            self.dash_timer -= dt
            self.x += self.vx
            if self.dash_timer <= 0:
                self.is_dashing = False
                self.vx = self.facing * self.speed
        else:
            self.vy -= 0.85  # Gravedad
            self.x += self.vx
            self.y += self.vy

        # Colisiones de plataformas
        self.is_on_ground = False
        for p in platforms:
            if p.collapsed:
                continue
            if self.right > p.left and self.left < p.right:
                if self.vy <= 0 and (self.bottom >= p.top - 14) and (self.bottom <= p.top + 10):
                    self.y = p.top + self.height / 2
                    self.vy = 0.0
                    self.is_on_ground = True
                    self.jumps_left = 2
                    p.standing_on = True

        if self.y < -300:
            self.hp = 0
            self.dead = True

    def draw(self):
        if self.dead:
            return
        if self.invulnerable_timer > 0 and int(self.invulnerable_timer * 15) % 2 == 0:
            return

        cx, cy, f = self.x, self.y, self.facing
        # Bufanda neón
        arcade.draw_triangle_filled(
            cx - f * 4, cy + 12,
            cx - f * 4, cy + 4,
            cx - f * 20, cy + 8,
            self.color
        )
        # Cuerpo y casco
        arcade.draw_rectangle_filled(cx, cy - 6, 16, 26, (18, 22, 38))
        arcade.draw_rectangle_filled(cx + f * 2, cy + 14, 15, 14, (12, 14, 24))
        # Visor de Neón
        arcade.draw_line(cx + f * 1, cy + 14, cx + f * 9, cy + 14, self.color, 3)

        # Nombre flotante encima de la cabeza
        arcade.draw_text(self.name, cx, cy + 28, self.color, 9, bold=True, anchor_x="center")


# =============================================================================
# VENTANA PRINCIPAL DEL JUEGO CON MENÚ, PAUSA Y SOPORTE MULTIJUGADOR
# =============================================================================
class MyGame(arcade.Window):
    def __init__(self):
        super().__init__(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_TITLE, resizable=True, antialiasing=True)
        arcade.set_background_color(COLOR_BG)

        # Estado del juego: 'lobby', 'countdown', 'playing', 'paused', 'game_over', 'round_win', 'ranking'
        self.state = 'lobby'
        self.mode = '1P'  # '1P' o '2P'
        self.current_world_idx = 0
        self.p1_name = "Kage Cyber"
        self.p2_name = "Neon Valkyrie"
        self.p1_char = "kage"
        self.p2_char = "valkyrie"
        self.wallet_coins = 450

        # Cámaras
        self.cam_world: Optional[arcade.Camera] = None
        self.cam_gui: Optional[arcade.Camera] = None
        self.cam_x = 0.0
        self.cam_y = 0.0

        # Entidades
        self.p1: Optional[PlayerRunner] = None
        self.p2: Optional[PlayerRunner] = None
        self.platforms: List[FloatingPlatform] = []
        self.lasers: List[LaserHazard] = []
        self.mines: List[EMPMine] = []
        self.coins: List[CryptoCoin] = []
        self.particles = ParticleEmitter()

        # Teclas y Gamepad
        self.keys = set()
        self.gamepads = []
        self.countdown_timer = 3.0
        self.round_winner_msg = ""

    def setup(self):
        self.cam_world = arcade.Camera(self.width, self.height)
        self.cam_gui = arcade.Camera(self.width, self.height)
        try:
            self.gamepads = arcade.get_gamepads()
            for gp in self.gamepads:
                gp.open()
        except Exception:
            pass

    def start_match(self):
        """Inicia el partido con el mundo seleccionado y los personajes elegidos."""
        world = WORLDS[self.current_world_idx]
        self.particles = ParticleEmitter()

        # Instanciar corredores
        self.p1 = PlayerRunner(1, self.p1_char, self.p1_name, 200, 300)
        if self.mode == '2P':
            self.p2 = PlayerRunner(2, self.p2_char, self.p2_name, 140, 300)
        else:
            self.p2 = None

        # Generar nivel del mundo actual
        self.platforms.clear()
        self.lasers.clear()
        self.mines.clear()
        self.coins.clear()

        # Plataforma inicial
        self.platforms.append(FloatingPlatform(200, 150, 480, 60, world["accent"]))

        # Carrera procedural a lo largo de la longitud del mundo
        cur_x = 550
        while cur_x < world["length"]:
            w = random.uniform(220, 420)
            h = random.uniform(40, 55)
            y = random.uniform(180, 450)
            is_moving = (self.current_world_idx >= 1 and random.random() < 0.35)
            is_collapsible = (self.current_world_idx >= 2 and random.random() < 0.28)

            plat = FloatingPlatform(cur_x, y, w, h, world["accent"], is_moving, 120, is_collapsible)
            self.platforms.append(plat)

            # Monedas sobre plataformas
            for cx in range(int(plat.left + 40), int(plat.right - 40), 70):
                if random.random() < 0.7:
                    self.coins.append(CryptoCoin(cx, plat.top + 28))

            # Minas EMP en mundos avanzados
            if self.current_world_idx >= 2 and random.random() < 0.4:
                self.mines.append(EMPMine(cur_x + random.uniform(-60, 60), y + 65))

            # Rayos Láser
            if self.current_world_idx >= 1 and random.random() < 0.3:
                self.lasers.append(LaserHazard(cur_x + w / 2 + 50, y - 60, y + 140))

            cur_x += w + random.uniform(120, 240)

        # Plataforma Meta Final con Portal
        self.goal_x = cur_x + 200
        self.platforms.append(FloatingPlatform(self.goal_x, 220, 450, 70, COLOR_CYAN))

        self.countdown_timer = 3.0
        self.state = 'countdown'

    def on_update(self, dt: float):
        if self.state == 'countdown':
            self.countdown_timer -= dt
            if self.countdown_timer <= 0:
                self.state = 'playing'
            return

        if self.state != 'playing':
            return

        # -------------------------------------------------------------
        # Procesamiento de Controles
        # -------------------------------------------------------------
        # Jugador 1: Teclado A/D + Gamepad 1
        p1_input_x = 0.0
        if arcade.key.A in self.keys:
            p1_input_x -= 1.0
        if arcade.key.D in self.keys:
            p1_input_x += 1.0

        if len(self.gamepads) > 0:
            gp = self.gamepads[0]
            if abs(gp.x) > 0.2:
                p1_input_x = gp.x

        if self.p1 and not self.p1.is_dashing:
            if abs(p1_input_x) > 0.05:
                self.p1.vx = p1_input_x * self.p1.speed
                self.p1.facing = 1 if p1_input_x > 0 else -1
            else:
                self.p1.vx *= 0.7

        # Jugador 2: Teclado Flechas + Gamepad 2
        if self.p2 and self.mode == '2P':
            p2_input_x = 0.0
            if arcade.key.LEFT in self.keys:
                p2_input_x -= 1.0
            if arcade.key.RIGHT in self.keys:
                p2_input_x += 1.0

            if len(self.gamepads) > 1:
                gp2 = self.gamepads[1]
                if abs(gp2.x) > 0.2:
                    p2_input_x = gp2.x

            if not self.p2.is_dashing:
                if abs(p2_input_x) > 0.05:
                    self.p2.vx = p2_input_x * self.p2.speed
                    self.p2.facing = 1 if p2_input_x > 0 else -1
                else:
                    self.p2.vx *= 0.7

        # Actualizar Plataformas, Obstáculos y Partículas
        for pl in self.platforms:
            pl.update(dt)
        for l in self.lasers:
            l.update(dt)
        self.particles.update(dt)

        # Actualizar Jugador 1
        if self.p1:
            self.p1.update(dt, self.platforms, self.particles)
            # Colisión con láser
            for l in self.lasers:
                if l.is_active and abs(self.p1.x - l.x) < 14 and (self.p1.y >= l.y_bottom and self.p1.y <= l.y_top):
                    self.p1.take_damage(25, self.particles)
            # Colisión con minas
            for m in self.mines:
                if m.update(dt, self.p1.x, self.p1.y, self.particles):
                    self.p1.take_damage(35, self.particles)
            # Recolección de monedas
            for c in self.coins:
                if not c.collected and math.hypot(self.p1.x - c.x, self.p1.y - c.y) < 28:
                    c.collected = True
                    self.p1.coins += 1
                    self.wallet_coins += 1
                    self.p1.score += 100

            # Meta
            if self.p1.x >= self.goal_x - 100:
                self.p1.reached_goal = True

        # Actualizar Jugador 2
        if self.p2 and self.mode == '2P':
            self.p2.update(dt, self.platforms, self.particles)
            for l in self.lasers:
                if l.is_active and abs(self.p2.x - l.x) < 14 and (self.p2.y >= l.y_bottom and self.p2.y <= l.y_top):
                    self.p2.take_damage(25, self.particles)
            for m in self.mines:
                if m.update(dt, self.p2.x, self.p2.y, self.particles):
                    self.p2.take_damage(35, self.particles)
            for c in self.coins:
                if not c.collected and math.hypot(self.p2.x - c.x, self.p2.y - c.y) < 28:
                    c.collected = True
                    self.p2.coins += 1
                    self.wallet_coins += 1
                    self.p2.score += 100
            if self.p2.x >= self.goal_x - 100:
                self.p2.reached_goal = True

        # -------------------------------------------------------------
        # Reglas de Victoria y Fin de Ronda
        # -------------------------------------------------------------
        if self.mode == '2P':
            # Si un amigo cae o pierde HP, gana el otro
            if self.p1.dead and not self.p2.dead:
                self.state = 'round_win'
                self.round_winner_msg = f"¡{self.p2.name} HA GANADO LA RONDA! ({self.p1.name} fue neutralizado)"
                self.p2.score += 1500
                RankingManager.add_score(self.p2.name, self.p2.score, WORLDS[self.current_world_idx]["name"], "2P Amigos", self.p2.char_data["name"], self.p2.coins)
            elif self.p2.dead and not self.p1.dead:
                self.state = 'round_win'
                self.round_winner_msg = f"¡{self.p1.name} HA GANADO LA RONDA! ({self.p2.name} fue neutralizado)"
                self.p1.score += 1500
                RankingManager.add_score(self.p1.name, self.p1.score, WORLDS[self.current_world_idx]["name"], "2P Amigos", self.p1.char_data["name"], self.p1.coins)
            elif self.p1.dead and self.p2.dead:
                self.state = 'game_over'
                self.round_winner_msg = "¡AMBOS CORREDORES HAN CAÍDO EN COMBATE!"
            elif self.p1.reached_goal and self.p2.reached_goal:
                self.state = 'round_win'
                self.round_winner_msg = "¡AMBOS LLEGARON A LA META! ¡NIVEL COMPLETADO EN EQUIPO!"
                RankingManager.add_score(f"{self.p1.name} & {self.p2.name}", self.p1.score + self.p2.score, WORLDS[self.current_world_idx]["name"], "2P Amigos", "Dúo Cooperativo", self.p1.coins + self.p2.coins)
        else:
            # 1P Solo
            if self.p1.dead:
                self.state = 'game_over'
                self.round_winner_msg = "SISTEMA CRÍTICO // INTENTO FALLIDO"
            elif self.p1.reached_goal:
                self.state = 'round_win'
                self.round_winner_msg = f"¡{self.p1.name} COMPLETÓ EL NIVEL CON ÉXITO!"
                RankingManager.add_score(self.p1.name, self.p1.score, WORLDS[self.current_world_idx]["name"], "1P Solo", self.p1.char_data["name"], self.p1.coins)

        # -------------------------------------------------------------
        # Cámara Lerp Fluida (Enfoca al punto medio o al jugador vivo)
        # -------------------------------------------------------------
        if self.p1 and self.p2 and not self.p1.dead and not self.p2.dead:
            target_x = (self.p1.x + self.p2.x) / 2 - self.width / 2 + 60
            target_y = (self.p1.y + self.p2.y) / 2 - self.height / 2 + 50
        elif self.p1 and not self.p1.dead:
            target_x = self.p1.x - self.width / 2 + (self.p1.facing * 80)
            target_y = self.p1.y - self.height / 2 + 50
        elif self.p2 and not self.p2.dead:
            target_x = self.p2.x - self.width / 2 + (self.p2.facing * 80)
            target_y = self.p2.y - self.height / 2 + 50
        else:
            target_x = self.cam_x
            target_y = self.cam_y

        self.cam_x += (target_x - self.cam_x) * 0.12
        self.cam_y += (target_y - self.cam_y) * 0.15
        self.cam_world.move_to((self.cam_x, self.cam_y))

    def on_draw(self):
        arcade.start_render()

        if self.state in ('countdown', 'playing', 'paused', 'round_win', 'game_over'):
            # Mundo 2D
            self.cam_world.use()
            for pl in self.platforms:
                pl.draw()
            for l in self.lasers:
                l.draw()
            for m in self.mines:
                m.draw()
            for c in self.coins:
                c.draw()
            self.particles.draw()
            if self.p1:
                self.p1.draw()
            if self.p2:
                self.p2.draw()

            # Portal Meta
            arcade.draw_rectangle_filled(self.goal_x, 290, 30, 140, (0, 245, 212, 100))
            arcade.draw_rectangle_outline(self.goal_x, 290, 30, 140, COLOR_CYAN, 3)

            # HUD
            self.cam_gui.use()
            self.draw_game_hud()

            # Modal de Pausa
            if self.state == 'paused':
                self.draw_pause_modal()
            elif self.state == 'countdown':
                self.draw_countdown_overlay()
            elif self.state in ('round_win', 'game_over'):
                self.draw_match_end_modal()
        else:
            # Lobby / Menú Principal
            self.cam_gui.use()
            self.draw_lobby()

    def draw_game_hud(self):
        # Barra superior con P1 y P2
        if self.p1:
            arcade.draw_rectangle_filled(160, self.height - 35, 220, 24, (15, 18, 30, 220))
            hp_w = max(0.0, min(1.0, self.p1.hp / self.p1.max_hp)) * 210
            arcade.draw_rectangle_filled(55 + hp_w / 2, self.height - 35, hp_w, 18, self.p1.color)
            arcade.draw_text(f"{self.p1.name}: {self.p1.hp} HP", 60, self.height - 40, (10, 10, 22), 10, bold=True)

        if self.p2:
            arcade.draw_rectangle_filled(420, self.height - 35, 220, 24, (15, 18, 30, 220))
            hp_w2 = max(0.0, min(1.0, self.p2.hp / self.p2.max_hp)) * 210
            arcade.draw_rectangle_filled(315 + hp_w2 / 2, self.height - 35, hp_w2, 18, self.p2.color)
            arcade.draw_text(f"{self.p2.name}: {self.p2.hp} HP", 320, self.height - 40, (10, 10, 22), 10, bold=True)

        # Monedas y Mundo actual
        world = WORLDS[self.current_world_idx]
        arcade.draw_text(f"◈ MONEDAS: {self.wallet_coins}", self.width / 2 - 70, self.height - 30, COLOR_YELLOW, 12, bold=True)
        arcade.draw_text(f"MAPA: {world['name']}", self.width / 2 - 70, self.height - 48, (160, 180, 210), 10)

        # Botón de Pausa [P] visible arriba a la derecha
        arcade.draw_rectangle_filled(self.width - 90, self.height - 35, 120, 32, (25, 30, 50, 220))
        arcade.draw_rectangle_outline(self.width - 90, self.height - 35, 120, 32, COLOR_CYAN, 1.5)
        arcade.draw_text("[P] PAUSA", self.width - 130, self.height - 42, COLOR_WHITE, 11, bold=True)

    def draw_pause_modal(self):
        # Overlay oscuro semitransparente
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2, self.width, self.height, (5, 5, 12, 220))
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2, 480, 320, (15, 18, 32))
        arcade.draw_rectangle_outline(self.width / 2, self.height / 2, 480, 320, COLOR_CYAN, 2)

        arcade.draw_text("SISTEMA EN PAUSA", self.width / 2, self.height / 2 + 100, COLOR_CYAN, 24, bold=True, anchor_x="center")
        arcade.draw_text("Presiona [P] o [ESC] para Continuar", self.width / 2, self.height / 2 + 40, COLOR_WHITE, 14, anchor_x="center")
        arcade.draw_text("Presiona [R] para Reiniciar Nivel", self.width / 2, self.height / 2 - 10, COLOR_YELLOW, 14, anchor_x="center")
        arcade.draw_text("Presiona [Q] para Salir al Menú Principal", self.width / 2, self.height / 2 - 60, COLOR_MAGENTA, 14, anchor_x="center")

    def draw_countdown_overlay(self):
        num = int(math.ceil(self.countdown_timer))
        text = str(num) if num > 0 else "¡RUN!"
        arcade.draw_text(text, self.width / 2, self.height / 2 - 40, COLOR_CYAN, 72, bold=True, anchor_x="center")

    def draw_match_end_modal(self):
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2, self.width, self.height, (5, 5, 12, 230))
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2, 600, 320, (15, 18, 35))
        col = COLOR_CYAN if self.state == 'round_win' else COLOR_RED_LASER
        arcade.draw_rectangle_outline(self.width / 2, self.height / 2, 600, 320, col, 2.5)

        arcade.draw_text(self.round_winner_msg, self.width / 2, self.height / 2 + 70, col, 18, bold=True, anchor_x="center")
        arcade.draw_text("Presiona [ESPACIO] para Continuar / Revancha", self.width / 2, self.height / 2 - 10, COLOR_WHITE, 14, anchor_x="center")
        arcade.draw_text("Presiona [ESC] o [Q] para Salir al Menú Principal", self.width / 2, self.height / 2 - 60, (180, 200, 220), 13, anchor_x="center")

    def draw_lobby(self):
        # Título Cyberpunk
        arcade.draw_text("NEON SHURIKEN: CYBERPUNK PROTOCOL", self.width / 2, self.height - 80, COLOR_CYAN, 26, bold=True, anchor_x="center")
        arcade.draw_text("CENTRO DE OPERACIONES Y LOBBY PRINCIPAL", self.width / 2, self.height - 110, (150, 180, 220), 12, anchor_x="center")

        # Tarjeta de Modo y Jugadores
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2 + 40, 700, 220, (18, 22, 38))
        arcade.draw_rectangle_outline(self.width / 2, self.height / 2 + 40, 700, 220, (50, 65, 100), 1.5)

        arcade.draw_text(f"Modo Actual: [{self.mode} - {'1 Jugador Solo' if self.mode == '1P' else '2 Jugadores Amigos'}]  (Pulsa [M] para cambiar)",
                         self.width / 2, self.height / 2 + 110, COLOR_YELLOW, 13, bold=True, anchor_x="center")

        arcade.draw_text(f"P1: {self.p1_name} ({CHARACTERS[self.p1_char]['name']})", self.width / 2 - 280, self.height / 2 + 70, COLOR_CYAN, 12, bold=True)
        if self.mode == '2P':
            arcade.draw_text(f"P2: {self.p2_name} ({CHARACTERS[self.p2_char]['name']})", self.width / 2 + 40, self.height / 2 + 70, COLOR_MAGENTA, 12, bold=True)

        w = WORLDS[self.current_world_idx]
        arcade.draw_text(f"Mundo Seleccionado: {w['name']} (Pulsa [N] para cambiar mundo)", self.width / 2, self.height / 2 + 20, COLOR_WHITE, 12, bold=True, anchor_x="center")
        arcade.draw_text(f"Obstáculos: {w['obstacles']}", self.width / 2, self.height / 2 - 5, (180, 190, 210), 11, anchor_x="center")

        # Botón Gigante de JUGAR / PLAY
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2 - 120, 320, 60, COLOR_CYAN)
        arcade.draw_text("▶ JUGAR (PULSA ENTER)", self.width / 2, self.height / 2 - 130, (10, 10, 22), 18, bold=True, anchor_x="center")

        # Teclas rápidas del menú
        arcade.draw_text("[ENTER] Jugar | [M] Cambiar Modo 1P/2P | [N] Cambiar Mundo | [T] Ver Ranking en Consola",
                         self.width / 2, 40, (140, 160, 200), 11, anchor_x="center")

    def on_key_press(self, symbol: int, modifiers: int):
        self.keys.add(symbol)

        # Pausa con tecla P o ESC
        if symbol in (arcade.key.P, arcade.key.ESCAPE):
            if self.state == 'playing':
                self.state = 'paused'
            elif self.state == 'paused':
                self.state = 'playing'
            return

        if self.state == 'paused':
            if symbol == arcade.key.R:
                self.start_match()
            elif symbol == arcade.key.Q:
                self.state = 'lobby'
            return

        if self.state in ('round_win', 'game_over'):
            if symbol in (arcade.key.SPACE, arcade.key.ENTER):
                if self.state == 'round_win':
                    self.current_world_idx = (self.current_world_idx + 1) % len(WORLDS)
                self.start_match()
            elif symbol in (arcade.key.ESCAPE, arcade.key.Q):
                self.state = 'lobby'
            return

        if self.state == 'lobby':
            if symbol == arcade.key.ENTER:
                self.start_match()
            elif symbol == arcade.key.M:
                self.mode = '2P' if self.mode == '1P' else '1P'
            elif symbol == arcade.key.N:
                self.current_world_idx = (self.current_world_idx + 1) % len(WORLDS)
            elif symbol == arcade.key.T:
                records = RankingManager.load_rankings()
                print("\n=== TABLÓN DE RANKING CYBERPUNK (PERSISTENTE) ===")
                for i, r in enumerate(records[:10], 1):
                    print(f"{i}. {r['name']} - {r['score']} pts | {r['world']} | {r['mode']} | {r['character']}")
            return

        # Jugador 1: Teclado
        if self.p1 and self.state == 'playing':
            if symbol == arcade.key.W:
                self.p1.trigger_jump(self.particles)
            elif symbol in (arcade.key.Q, arcade.key.LSHIFT):
                self.p1.trigger_dash(self.particles)
            elif symbol in (arcade.key.F, arcade.key.E):
                self.p1.trigger_attack(self.particles)

        # Jugador 2: Teclado
        if self.p2 and self.mode == '2P' and self.state == 'playing':
            if symbol == arcade.key.UP:
                self.p2.trigger_jump(self.particles)
            elif symbol in (arcade.key.DOWN, arcade.key.RSHIFT, arcade.key.M):
                self.p2.trigger_dash(self.particles)
            elif symbol in (arcade.key.ENTER, arcade.key.L):
                self.p2.trigger_attack(self.particles)

    def on_key_release(self, symbol: int, modifiers: int):
        if symbol in self.keys:
            self.keys.remove(symbol)


def main():
    window = MyGame()
    window.setup()
    arcade.run()


if __name__ == "__main__":
    main()
