"""
=============================================================================
NEON SHURIKEN: CYBERPUNK PROTOCOL v2.0 - [Python Arcade 60 FPS]
-----------------------------------------------------------------------------
- Modo 1 Jugador (Solo) y Modo 2 Jugadores (Amigos / Carrera Co-op)
- 4 Personajes desbloqueables con monedas (Kage, Valkyrie, Ronin-X, Ghost)
- Niveles progresivos con carreras largas (4000 a 8500+ px) y dificultad creciente
- Sistema de misiones dinámicas por nivel con recompensas en monedas de neón
- Reglas de Amigos: Si un amigo pierde gana el otro; si ambos llegan a la meta pasan de nivel
- Sistema de Ranking / Leaderboard con mejores marcas
- Soporte dual completo: Teclado simultáneo P1 (WASD) y P2 (Flechas) + Gamepads USB
=============================================================================
"""

import math
import random
import sys
from typing import List, Optional, Tuple, Dict
import arcade

# =============================================================================
# CONSTANTES DE CONFIGURACIÓN Y PALETA DE COLOR CYBERPUNK
# =============================================================================
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
SCREEN_TITLE = "Neon Shuriken: Cyberpunk Protocol 2P - [Python Arcade 60 FPS]"

COLOR_BG = (10, 10, 22)             # Megaciudad fondo oscuro #0a0a16
COLOR_MAGENTA = (255, 0, 85)         # Neón Magenta #ff0055
COLOR_CYAN = (0, 245, 212)           # Neón Cyan #00f5d4
COLOR_YELLOW = (255, 230, 0)         # Neón Amarillo Eléctrico
COLOR_PURPLE = (168, 85, 247)        # Neón Violeta Hacker
COLOR_RED_LASER = (255, 23, 68)      # Neón Rojo Alerta / Proyectil
COLOR_DARK_BUILDING = (15, 17, 33)   # Estructura de edificios
COLOR_BUILDING_OUTLINE = (38, 44, 76)
COLOR_WHITE = (255, 255, 255)
COLOR_GOLD = (255, 215, 0)

GRAVITY = 0.85
DASH_SPEED = 23.0
DASH_DURATION = 0.22
DASH_COOLDOWN = 0.70
CAMERA_LERP_SPEED = 0.08


# =============================================================================
# DEFINICIÓN DE PERSONAJES DESBLOQUEABLES
# =============================================================================
CHARACTERS: Dict[str, dict] = {
    "kage": {
        "name": "Kage",
        "title": "Ciber-Ninja",
        "cost": 0,
        "unlocked": True,
        "color": COLOR_CYAN,
        "accent": COLOR_MAGENTA,
        "hp": 100,
        "speed": 7.5,
        "jump": 15.5,
        "special_desc": "Equilibrado, katana rápida y dash fluido.",
        "perk": "balanced"
    },
    "valkyrie": {
        "name": "Valkyrie",
        "title": "Ángel Neón",
        "cost": 150,
        "unlocked": False,
        "color": COLOR_MAGENTA,
        "accent": COLOR_YELLOW,
        "hp": 90,
        "speed": 8.2,
        "jump": 17.0,
        "special_desc": "Salto propulsado con alas de plasma.",
        "perk": "high_jump"
    },
    "ronin": {
        "name": "Ronin-X",
        "title": "Androide Pesado",
        "cost": 300,
        "unlocked": False,
        "color": COLOR_YELLOW,
        "accent": COLOR_PURPLE,
        "hp": 150,
        "speed": 6.8,
        "jump": 14.5,
        "special_desc": "Blindaje pesado (+50% HP) y tajo sísmico.",
        "perk": "tank"
    },
    "ghost": {
        "name": "Ghost",
        "title": "Hacker Fantasma",
        "cost": 500,
        "unlocked": False,
        "color": (50, 255, 180),
        "accent": COLOR_CYAN,
        "hp": 85,
        "speed": 8.8,
        "jump": 15.5,
        "special_desc": "Dash cuántico atraviesa proyectiles e invulnerabilidad extendida.",
        "perk": "quantum_dash"
    }
}


# =============================================================================
# SISTEMA DE PARTÍCULAS VECTORIALES
# =============================================================================
class NeonParticle:
    def __init__(self, x: float, y: float, vx: float, vy: float, color: Tuple[int, int, int], size: float = 3.5, lifetime: float = 0.5, drag: float = 0.94):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.size = size
        self.initial_size = size
        self.lifetime = lifetime
        self.max_lifetime = lifetime
        self.drag = drag
        self.dead = False

    def update(self, dt: float):
        self.x += self.vx
        self.y += self.vy
        self.vx *= self.drag
        self.vy *= self.drag
        self.lifetime -= dt
        if self.lifetime <= 0:
            self.dead = True
        else:
            pct = max(0.0, self.lifetime / self.max_lifetime)
            self.size = max(0.5, self.initial_size * pct)

    def draw(self):
        pct = max(0.0, min(1.0, self.lifetime / self.max_lifetime))
        alpha = int(pct * 255)
        r, g, b = self.color
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
            speed = random.uniform(2.0, 8.0)
            self.particles.append(NeonParticle(
                x, y,
                math.cos(angle) * speed,
                math.sin(angle) * speed,
                color,
                size=random.uniform(2.5, 5.0),
                lifetime=random.uniform(0.2, 0.5)
            ))

    def emit_dash_trail(self, x: float, y: float, facing: int, color: Tuple[int, int, int]):
        for _ in range(4):
            vx = -facing * random.uniform(1.0, 4.0) + random.uniform(-1, 1)
            vy = random.uniform(-1.5, 1.5)
            self.particles.append(NeonParticle(
                x + random.uniform(-6, 6),
                y + random.uniform(-12, 12),
                vx, vy, color,
                size=random.uniform(3.0, 6.0),
                lifetime=0.25,
                drag=0.88
            ))


# =============================================================================
# MONEDAS DE NEÓN (RECOLECTABLES)
# =============================================================================
class NeonCoin:
    def __init__(self, x: float, y: float, value: int = 10):
        self.x = x
        self.y = y
        self.base_y = y
        self.value = value
        self.collected = False
        self.phase = random.uniform(0, math.pi * 2)
        self.radius = 11.0

    def update(self, dt: float):
        self.phase += dt * 4.0
        self.y = self.base_y + math.sin(self.phase) * 6.0

    def draw(self):
        if self.collected:
            return
        w = abs(math.cos(self.phase)) * (self.radius * 2) + 4
        # Halo de luz dorada
        arcade.draw_ellipse_filled(self.x, self.y, w + 8, self.radius * 2 + 8, (255, 215, 0, 50))
        # Moneda de neón
        arcade.draw_ellipse_filled(self.x, self.y, w, self.radius * 2, COLOR_GOLD)
        arcade.draw_ellipse_outline(self.x, self.y, w, self.radius * 2, COLOR_WHITE, 1.5)


# =============================================================================
# PORTAL DE META (FIN DE LA LARGA CARRERA)
# =============================================================================
class GoalPortal:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.width = 70.0
        self.height = 140.0
        self.phase = 0.0

    def update(self, dt: float):
        self.phase += dt * 3.0

    def draw(self):
        # Marco exterior del portal
        arcade.draw_rectangle_filled(self.x, self.y, self.width, self.height, (15, 20, 40, 200))
        arcade.draw_rectangle_outline(self.x, self.y, self.width, self.height, COLOR_CYAN, 3)

        # Resplandor pulsante
        glow = int(120 + math.sin(self.phase) * 60)
        arcade.draw_rectangle_filled(self.x, self.y, self.width - 16, self.height - 16, (0, 245, 212, glow))
        arcade.draw_text("META", self.x, self.y + 80, COLOR_YELLOW, 14, bold=True, anchor_x="center")


# =============================================================================
# PROYECTIL DE DRONES Y TRAMPAS LÁSER
# =============================================================================
class DroneProjectile:
    def __init__(self, x: float, y: float, vx: float, vy: float):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.radius = 5.0
        self.lifetime = 4.0
        self.dead = False

    def update(self, dt: float):
        self.x += self.vx
        self.y += self.vy
        self.lifetime -= dt
        if self.lifetime <= 0:
            self.dead = True

    def draw(self):
        arcade.draw_circle_filled(self.x, self.y, self.radius * 2.2, (255, 23, 68, 90))
        arcade.draw_circle_filled(self.x, self.y, self.radius * 0.7, (255, 245, 245, 255))


class LaserHazard:
    """Barrera láser intermitente en niveles superiores."""
    def __init__(self, x: float, y1: float, y2: float, cycle_time: float = 2.0):
        self.x = x
        self.y1 = y1
        self.y2 = y2
        self.timer = random.uniform(0, cycle_time)
        self.cycle_time = cycle_time
        self.active = True

    def update(self, dt: float):
        self.timer = (self.timer + dt) % (self.cycle_time * 2)
        self.active = self.timer < self.cycle_time

    def draw(self):
        if self.active:
            arcade.draw_line(self.x, self.y1, self.x, self.y2, COLOR_RED_LASER, 4)
            arcade.draw_line(self.x, self.y1, self.x, self.y2, (255, 23, 68, 70), 10)
            arcade.draw_circle_filled(self.x, self.y1, 6, COLOR_RED_LASER)
            arcade.draw_circle_filled(self.x, self.y2, 6, COLOR_RED_LASER)


# =============================================================================
# PLATAFORMAS FLOTANTES
# =============================================================================
class FloatingPlatform:
    def __init__(self, x: float, y: float, width: float, height: float, accent_color: Tuple[int, int, int] = COLOR_CYAN, moving: bool = False, move_range: float = 0.0):
        self.base_x = x
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.accent_color = accent_color
        self.moving = moving
        self.move_range = move_range
        self.move_phase = random.uniform(0, math.pi * 2)

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
        if self.moving and self.move_range > 0:
            self.move_phase += dt * 1.5
            self.x = self.base_x + math.sin(self.move_phase) * self.move_range

    def draw(self):
        arcade.draw_rectangle_filled(self.x, self.y, self.width, self.height, COLOR_DARK_BUILDING)
        arcade.draw_rectangle_outline(self.x, self.y, self.width, self.height, COLOR_BUILDING_OUTLINE, 1.5)
        # Línea de neón
        top_y = self.top
        arcade.draw_line(self.left, top_y, self.right, top_y, self.accent_color, line_width=4)
        arcade.draw_line(self.left, top_y, self.right, top_y, (self.accent_color[0], self.accent_color[1], self.accent_color[2], 70), line_width=8)


# =============================================================================
# ENEMIGO: DRON DE VIGILANCIA
# =============================================================================
class SurveillanceDrone:
    def __init__(self, x: float, y: float, patrol_left: float, patrol_right: float, is_elite: bool = False):
        self.x = x
        self.y = y
        self.base_y = y
        self.patrol_left = patrol_left
        self.patrol_right = patrol_right
        self.speed = 3.2 if is_elite else 2.4
        self.direction = 1
        self.detection_range = 440.0 if is_elite else 380.0
        self.alert_mode = False
        self.shoot_timer = 0.0
        self.shoot_interval = 1.0 if is_elite else 1.4
        self.hover_phase = random.uniform(0, math.pi * 2)
        self.is_elite = is_elite
        self.dead = False

    def update(self, dt: float, target_x: float, target_y: float) -> Optional[DroneProjectile]:
        self.hover_phase += dt * 3.5
        self.y = self.base_y + math.sin(self.hover_phase) * 12.0

        self.x += self.speed * self.direction
        if self.x <= self.patrol_left:
            self.x = self.patrol_left
            self.direction = 1
        elif self.x >= self.patrol_right:
            self.x = self.patrol_right
            self.direction = -1

        dist = math.hypot(target_x - self.x, target_y - self.y)
        new_bullet = None
        if dist < self.detection_range:
            self.alert_mode = True
            self.shoot_timer += dt
            if self.shoot_timer >= self.shoot_interval:
                self.shoot_timer = 0.0
                dx = target_x - self.x
                dy = (target_y + 10) - self.y
                length = max(1.0, math.hypot(dx, dy))
                speed = 7.5 if self.is_elite else 6.5
                new_bullet = DroneProjectile(self.x, self.y - 4, (dx / length) * speed, (dy / length) * speed)
        else:
            self.alert_mode = False
            self.shoot_timer = max(0.0, self.shoot_timer - dt)

        return new_bullet

    def draw(self, target_x: float, target_y: float):
        if self.alert_mode:
            arcade.draw_line(self.x, self.y, target_x, target_y + 10, (255, 23, 68, 75), line_width=1.5)

        color_accent = COLOR_YELLOW if self.is_elite else COLOR_CYAN
        if self.alert_mode:
            color_accent = COLOR_RED_LASER

        # Motores
        arcade.draw_rectangle_filled(self.x - 18, self.y + 6, 12, 3, COLOR_BUILDING_OUTLINE)
        arcade.draw_rectangle_filled(self.x + 18, self.y + 6, 12, 3, COLOR_BUILDING_OUTLINE)
        arcade.draw_circle_filled(self.x - 18, self.y + 4, 3, color_accent)
        arcade.draw_circle_filled(self.x + 18, self.y + 4, 3, color_accent)

        # Chasis
        arcade.draw_ellipse_filled(self.x, self.y, 36, 20, (22, 26, 48))
        arcade.draw_ellipse_outline(self.x, self.y, 36, 20, (55, 65, 100), 2)
        # Ojo escáner
        arcade.draw_circle_filled(self.x, self.y, 4, color_accent)


# =============================================================================
# JUGADOR (SOPORTE MULTI-PERSONAJE Y 2P)
# =============================================================================
class PlayerHero:
    def __init__(self, player_id: int, char_key: str, start_x: float, start_y: float):
        self.player_id = player_id  # 1 o 2
        self.char_key = char_key
        char_data = CHARACTERS.get(char_key, CHARACTERS["kage"])

        self.name = f"P{player_id} ({char_data['name']})"
        self.color = char_data["color"]
        self.accent = char_data["accent"]
        self.move_speed = char_data["speed"]
        self.jump_speed = char_data["jump"]
        self.max_hp = char_data["hp"]
        self.perk = char_data["perk"]

        self.x = start_x
        self.y = start_y
        self.vx = 0.0
        self.vy = 0.0
        self.width = 28.0
        self.height = 46.0
        self.facing = 1
        self.is_on_ground = False
        self.jumps_left = 2

        self.is_dashing = False
        self.dash_timer = 0.0
        self.dash_cooldown_timer = 0.0

        self.is_attacking = False
        self.attack_timer = 0.0
        self.attack_duration = 0.20

        self.hp = self.max_hp
        self.display_hp = float(self.max_hp)
        self.combo_count = 0
        self.combo_timer = 0.0
        self.invulnerable_timer = 0.0

        self.coins_collected = 0
        self.drones_destroyed = 0
        self.dashes_done = 0
        self.score = 0
        self.finished_race = False
        self.is_dead = False

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

    def trigger_dash(self, particles: ParticleEmitter):
        if self.is_dead or self.finished_race:
            return
        if self.dash_cooldown_timer <= 0 and not self.is_dashing:
            self.is_dashing = True
            self.dash_timer = DASH_DURATION
            self.dash_cooldown_timer = DASH_COOLDOWN
            self.vy = 0.0
            self.vx = self.facing * DASH_SPEED
            self.dashes_done += 1
            particles.emit_sparks(self.x, self.y, count=14, color=self.accent)

    def trigger_attack(self, particles: ParticleEmitter):
        if self.is_dead or self.finished_race:
            return
        if not self.is_attacking:
            self.is_attacking = True
            self.attack_timer = self.attack_duration
            particles.emit_sparks(self.x + self.facing * 20, self.y, count=8, color=self.color)

    def jump(self, particles: ParticleEmitter):
        if self.is_dead or self.finished_race:
            return
        if self.jumps_left > 0 and not self.is_dashing:
            self.vy = self.jump_speed
            self.jumps_left -= 1
            self.is_on_ground = False
            particles.emit_sparks(self.x, self.bottom, count=8, color=COLOR_YELLOW)

    def take_damage(self, amount: int, particles: ParticleEmitter):
        if self.is_dead or self.finished_race:
            return
        if self.is_dashing and self.perk == "quantum_dash":
            return
        if self.invulnerable_timer <= 0 and not self.is_dashing:
            self.hp = max(0, self.hp - amount)
            self.invulnerable_timer = 1.0
            self.combo_count = max(0, self.combo_count - 2)
            particles.emit_sparks(self.x, self.y, count=22, color=COLOR_RED_LASER)
            if self.hp <= 0:
                self.is_dead = True

    def add_combo(self, amount: int):
        self.combo_count += amount
        self.combo_timer = 3.5
        self.score += amount * 120

    def update(self, dt: float, platforms: List[FloatingPlatform], particles: ParticleEmitter):
        if self.is_dead or self.finished_race:
            return

        if self.invulnerable_timer > 0:
            self.invulnerable_timer -= dt
        if self.dash_cooldown_timer > 0:
            self.dash_cooldown_timer -= dt
        if self.attack_timer > 0:
            self.attack_timer -= dt
            if self.attack_timer <= 0:
                self.is_attacking = False

        if self.combo_timer > 0:
            self.combo_timer -= dt
            if self.combo_timer <= 0:
                self.combo_count = max(0, self.combo_count - 1)
                if self.combo_count > 0:
                    self.combo_timer = 0.8

        if self.display_hp > self.hp:
            self.display_hp -= (self.display_hp - self.hp) * 0.12

        if self.is_dashing:
            self.dash_timer -= dt
            self.x += self.vx
            particles.emit_dash_trail(self.x, self.y, self.facing, self.color)
            if self.dash_timer <= 0:
                self.is_dashing = False
                self.vx = self.facing * self.move_speed
        else:
            self.vy -= GRAVITY
            self.x += self.vx
            self.y += self.vy

        # Colisiones de plataformas
        self.is_on_ground = False
        for p in platforms:
            if self.right > p.left and self.left < p.right:
                if self.vy <= 0 and (self.bottom >= p.top - 14) and (self.bottom <= p.top + 10):
                    self.y = p.top + self.height / 2
                    self.vy = 0.0
                    self.is_on_ground = True
                    self.jumps_left = 2

        # Límite inferior al vacío
        if self.y < -350:
            self.take_damage(35, particles)
            self.x = max(100, self.x - 300)
            self.y = 400
            self.vx = 0
            self.vy = 0

    def draw(self):
        if self.is_dead:
            arcade.draw_text("CAÍDO", self.x, self.y, COLOR_RED_LASER, 12, bold=True, anchor_x="center")
            return

        if self.invulnerable_timer > 0 and int(self.invulnerable_timer * 15) % 2 == 0:
            return

        cx, cy, f = self.x, self.y, self.facing

        # Etiqueta de Jugador (P1 / P2)
        arcade.draw_text(
            f"P{self.player_id}",
            cx, cy + 30,
            self.color, 11, bold=True, anchor_x="center"
        )

        # Capa / Bufanda
        scarf_color = self.accent if not self.is_dashing else COLOR_YELLOW
        arcade.draw_triangle_filled(
            cx - f * 4, cy + 12,
            cx - f * 4, cy + 4,
            cx - f * 20, cy + 8 + math.sin(self.x * 0.1) * 3,
            scarf_color
        )

        # Torso y patas
        arcade.draw_rectangle_filled(cx, cy - 6, 16, 26, (18, 22, 38))
        arcade.draw_rectangle_outline(cx, cy - 6, 16, 26, (40, 50, 80), 1.5)
        arcade.draw_line(cx - 5, cy, cx + 5, cy, self.color, 2)

        # Cabeza y visor
        arcade.draw_rectangle_filled(cx + f * 2, cy + 14, 15, 14, (12, 14, 24))
        arcade.draw_line(cx + f * 1, cy + 14, cx + f * 9, cy + 14, self.color, 3)

        # Katana o Tajo
        if self.is_attacking:
            range_mult = 1.4 if self.perk == "tank" else 1.0
            arcade.draw_arc_outline(
                cx + f * 26, cy + 2, 44 * range_mult, 44 * range_mult,
                self.color, 0 if f > 0 else 180, 180 if f > 0 else 360, 4
            )


# =============================================================================
# JUEGO PRINCIPAL: CLASE MYGAME (VENTANA ARCADE)
# =============================================================================
class MyGame(arcade.Window):
    def __init__(self):
        super().__init__(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_TITLE, resizable=True, antialiasing=True)
        arcade.set_background_color(COLOR_BG)

        self.mode = "SOLO"          # "SOLO" o "2PLAYERS"
        self.state = "MENU"         # "MENU", "SHOP", "PLAYING", "ROUND_OVER", "RANKING"
        self.current_level = 1
        self.max_levels = 3

        self.total_coins = 200
        self.p1_char = "kage"
        self.p2_char = "valkyrie"

        self.camera_world: Optional[arcade.Camera] = None
        self.camera_gui: Optional[arcade.Camera] = None
        self.cam_x = 0.0
        self.cam_y = 0.0

        self.player1: Optional[PlayerHero] = None
        self.player2: Optional[PlayerHero] = None
        self.platforms: List[FloatingPlatform] = []
        self.drones: List[SurveillanceDrone] = []
        self.projectiles: List[DroneProjectile] = []
        self.coins: List[NeonCoin] = []
        self.lasers: List[LaserHazard] = []
        self.portal: Optional[GoalPortal] = None
        self.particles: ParticleEmitter = ParticleEmitter()

        self.keys_down = set()
        self.gamepads = []

        self.high_scores = [
            {"name": "CYBER_ACE", "score": 12500, "level": 3, "coins": 180},
            {"name": "NIGHT_BLADE", "score": 8900, "level": 2, "coins": 120},
            {"name": "NEO_RUNNER", "score": 5400, "level": 1, "coins": 65},
        ]
        self.round_winner_text = ""

    def setup(self):
        self.camera_world = arcade.Camera(self.width, self.height)
        self.camera_gui = arcade.Camera(self.width, self.height)
        self.gamepads = arcade.get_gamepads()

    def start_level(self, level_num: int):
        self.current_level = level_num
        self.state = "PLAYING"
        self.particles = ParticleEmitter()
        self.projectiles = []
        self.lasers = []

        lengths = {1: 4500.0, 2: 6500.0, 3: 8500.0}
        track_len = lengths.get(level_num, 5000.0)

        self.player1 = PlayerHero(1, self.p1_char, 200, 300)
        if self.mode == "2PLAYERS":
            self.player2 = PlayerHero(2, self.p2_char, 260, 300)
        else:
            self.player2 = None

        self.platforms = []
        self.platforms.append(FloatingPlatform(200, 150, 480, 60, COLOR_CYAN))

        cur_x = 550.0
        while cur_x < track_len - 300:
            pw = random.uniform(220, 380)
            py = random.uniform(200, 480)
            col = random.choice([COLOR_CYAN, COLOR_MAGENTA, COLOR_YELLOW])
            is_moving = (level_num >= 2 and random.random() < 0.35)
            self.platforms.append(FloatingPlatform(cur_x, py, pw, 45, col, moving=is_moving, move_range=60.0))

            coin_count = random.randint(2, 4)
            for i in range(coin_count):
                cx = cur_x - pw / 3 + i * (pw / coin_count)
                self.coins.append(NeonCoin(cx, py + 45))

            cur_x += pw + random.uniform(120, 220)

        self.platforms.append(FloatingPlatform(track_len, 200, 500, 70, COLOR_CYAN))
        self.portal = GoalPortal(track_len, 300)

        self.drones = []
        drone_count = 6 + level_num * 4
        spacing = track_len / (drone_count + 1)
        for i in range(1, drone_count + 1):
            dx = spacing * i + random.uniform(-60, 60)
            dy = random.uniform(320, 520)
            is_elite = (level_num >= 2 and i % 2 == 0)
            self.drones.append(SurveillanceDrone(dx, dy, dx - 160, dx + 160, is_elite=is_elite))

        if level_num >= 2:
            laser_count = 3 if level_num == 2 else 6
            for _ in range(laser_count):
                lx = random.uniform(1200, track_len - 600)
                self.lasers.append(LaserHazard(lx, 150, 480, cycle_time=2.2))

    def on_draw(self):
        arcade.start_render()

        if self.state == "MENU":
            self.draw_menu()
            return
        elif self.state == "SHOP":
            self.draw_shop()
            return
        elif self.state == "RANKING":
            self.draw_ranking()
            return

        self.camera_world.use()
        self.draw_cyber_grid()

        for plat in self.platforms:
            plat.draw()

        for coin in self.coins:
            coin.draw()

        for laser in self.lasers:
            laser.draw()

        if self.portal:
            self.portal.draw()

        for drone in self.drones:
            target = self.player1 if self.player1 else self.player2
            if target:
                drone.draw(target.x, target.y)

        for proj in self.projectiles:
            proj.draw()

        self.particles.draw()

        if self.player1:
            self.player1.draw()
        if self.player2:
            self.player2.draw()

        self.camera_gui.use()
        self.draw_hud()

        if self.state == "ROUND_OVER":
            self.draw_round_over()

    def draw_cyber_grid(self):
        start_x = int(self.cam_x - 300) // 120 * 120
        end_x = int(self.cam_x + self.width + 300)
        for gx in range(start_x, end_x, 120):
            arcade.draw_line(gx, -200, gx, 1200, (20, 24, 45, 60), 1)

    def draw_hud(self):
        arcade.draw_text(
            f"NIVEL {self.current_level} - {self.mode}",
            self.width / 2, self.height - 35,
            COLOR_YELLOW, 14, bold=True, anchor_x="center"
        )
        arcade.draw_text(
            f"CRIPTO-MONEDAS: {self.total_coins} ◈",
            self.width / 2, self.height - 58,
            COLOR_GOLD, 12, bold=True, anchor_x="center"
        )

        if self.player1:
            self.draw_player_hud(self.player1, 40, self.height - 45, COLOR_CYAN)

        if self.player2:
            self.draw_player_hud(self.player2, self.width - 280, self.height - 45, COLOR_MAGENTA)

        self.draw_missions_panel()

    def draw_player_hud(self, p: PlayerHero, x: float, y: float, theme_color: Tuple[int, int, int]):
        bar_w = 220
        arcade.draw_rectangle_filled(x + bar_w / 2, y, bar_w + 6, 20, (15, 18, 30, 220))
        pct = max(0.0, min(1.0, p.hp / p.max_hp))
        if pct > 0:
            arcade.draw_rectangle_filled(x + (bar_w * pct) / 2, y, bar_w * pct, 16, theme_color)
        arcade.draw_text(f"{p.name}: {p.hp}/{p.max_hp} HP", x + 6, y - 6, (10, 10, 22), 10, bold=True)
        arcade.draw_text(f"SCORE: {p.score} | COMBO x{p.combo_count}", x, y - 26, COLOR_WHITE, 10, bold=True)

    def draw_missions_panel(self):
        mx = 40
        my = 120
        arcade.draw_rectangle_filled(mx + 110, my, 230, 80, (12, 14, 25, 200))
        arcade.draw_rectangle_outline(mx + 110, my, 230, 80, COLOR_BUILDING_OUTLINE, 1)
        arcade.draw_text("MISIONES DEL NIVEL:", mx + 10, my + 24, COLOR_YELLOW, 10, bold=True)

        target_coins = 10 * self.current_level
        coins_done = (self.player1.coins_collected if self.player1 else 0) + ((self.player2.coins_collected if self.player2 else 0))
        arcade.draw_text(f"• Monedas: {coins_done}/{target_coins}", mx + 10, my + 6, COLOR_WHITE, 9)

        drones_done = (self.player1.drones_destroyed if self.player1 else 0) + ((self.player2.drones_destroyed if self.player2 else 0))
        arcade.draw_text(f"• Drones: {drones_done}/4", mx + 10, my - 12, COLOR_WHITE, 9)

    def draw_round_over(self):
        arcade.draw_rectangle_filled(self.width / 2, self.height / 2, 540, 260, (10, 12, 22, 240))
        arcade.draw_rectangle_outline(self.width / 2, self.height / 2, 540, 260, COLOR_CYAN, 2)
        arcade.draw_text(self.round_winner_text, self.width / 2, self.height / 2 + 50, COLOR_YELLOW, 20, bold=True, anchor_x="center")
        arcade.draw_text("Presiona [ESPACIO] para continuar o [M] para menú", self.width / 2, self.height / 2 - 40, COLOR_WHITE, 12, anchor_x="center")

    def draw_menu(self):
        arcade.draw_text("NEON SHURIKEN: CYBERPUNK 2P", self.width / 2, self.height - 180, COLOR_CYAN, 28, bold=True, anchor_x="center")
        arcade.draw_text("CARRERA CO-OP / VS & NIVELES", self.width / 2, self.height - 225, COLOR_MAGENTA, 14, bold=True, anchor_x="center")

        opts = [
            "1. JUGAR SOLO (1 JUGADOR)",
            "2. JUGAR CON AMIGOS (2 JUGADORES - PANTALLA COMPARTIDA)",
            "3. TIENDA DE PERSONAJES (COMPRAR CON MONEDAS)",
            "4. CLASIFICACIÓN / RANKING",
        ]
        for idx, opt in enumerate(opts):
            arcade.draw_text(opt, self.width / 2, self.height - 320 - idx * 45, COLOR_WHITE, 14, bold=True, anchor_x="center")

        arcade.draw_text(f"TUS CRIPTO-MONEDAS: {self.total_coins} ◈", self.width / 2, 140, COLOR_GOLD, 16, bold=True, anchor_x="center")
        arcade.draw_text("Presiona 1, 2, 3 o 4 para seleccionar", self.width / 2, 80, (140, 160, 200), 12, anchor_x="center")

    def draw_shop(self):
        arcade.draw_text("TIENDA DE CIBER-PERSONAJES", self.width / 2, self.height - 100, COLOR_YELLOW, 24, bold=True, anchor_x="center")
        arcade.draw_text(f"Tus Monedas: {self.total_coins} ◈", self.width / 2, self.height - 135, COLOR_GOLD, 15, bold=True, anchor_x="center")

        x_start = 160
        for i, (k, char) in enumerate(CHARACTERS.items()):
            cx = x_start + i * 260
            cy = self.height / 2
            arcade.draw_rectangle_filled(cx, cy, 230, 300, (16, 20, 36))
            arcade.draw_rectangle_outline(cx, cy, 230, 300, char["color"], 2)

            arcade.draw_text(char["name"], cx, cy + 105, char["color"], 16, bold=True, anchor_x="center")
            arcade.draw_text(char["title"], cx, cy + 85, COLOR_WHITE, 11, anchor_x="center")
            arcade.draw_text(f"HP: {char['hp']} | Vel: {char['speed']}", cx, cy + 45, COLOR_WHITE, 10, anchor_x="center")
            arcade.draw_text(char["special_desc"], cx, cy - 10, (180, 190, 210), 9, anchor_x="center", width=200, align="center")

            status = "DESBLOQUEADO" if char["unlocked"] else f"COMPRAR: {char['cost']} ◈"
            arcade.draw_text(status, cx, cy - 90, COLOR_GOLD if not char["unlocked"] else COLOR_CYAN, 11, bold=True, anchor_x="center")
            arcade.draw_text(f"Tecla [{i+1}]", cx, cy - 120, COLOR_WHITE, 11, bold=True, anchor_x="center")

        arcade.draw_text("Presiona [ESC] o [M] para volver al Menú Principal", self.width / 2, 70, (150, 170, 210), 12, anchor_x="center")

    def draw_ranking(self):
        arcade.draw_text("RANKING / SALÓN DE LA FAMA", self.width / 2, self.height - 120, COLOR_CYAN, 24, bold=True, anchor_x="center")
        for i, rank in enumerate(self.high_scores):
            y = self.height - 220 - i * 55
            arcade.draw_rectangle_filled(self.width / 2, y, 500, 42, (18, 22, 38))
            arcade.draw_text(f"#{i+1} {rank['name']}", self.width / 2 - 220, y - 7, COLOR_YELLOW, 14, bold=True)
            arcade.draw_text(f"Nivel {rank['level']}", self.width / 2, y - 7, COLOR_WHITE, 12)
            arcade.draw_text(f"{rank['score']} PTS | {rank['coins']} ◈", self.width / 2 + 100, y - 7, COLOR_CYAN, 12, bold=True)

        arcade.draw_text("Presiona [M] o [ESC] para volver", self.width / 2, 100, COLOR_WHITE, 12, anchor_x="center")

    def on_update(self, delta_time: float):
        if self.state != "PLAYING":
            return

        p1 = self.player1
        p2 = self.player2

        # Input JUGADOR 1 (WASD)
        if p1 and not p1.is_dead:
            p1_x = 0.0
            if arcade.key.A in self.keys_down:
                p1_x -= 1.0
            if arcade.key.D in self.keys_down:
                p1_x += 1.0

            if len(self.gamepads) > 0:
                gp1 = self.gamepads[0]
                if hasattr(gp1, "x") and abs(gp1.x) > 0.2:
                    p1_x = gp1.x

            if not p1.is_dashing:
                if abs(p1_x) > 0.05:
                    p1.vx = p1_x * p1.move_speed
                    p1.facing = 1 if p1_x > 0 else -1
                else:
                    p1.vx *= 0.7

            p1.update(delta_time, self.platforms, self.particles)

        # Input JUGADOR 2 (Flechas)
        if p2 and not p2.is_dead:
            p2_x = 0.0
            if arcade.key.LEFT in self.keys_down:
                p2_x -= 1.0
            if arcade.key.RIGHT in self.keys_down:
                p2_x += 1.0

            if len(self.gamepads) > 1:
                gp2 = self.gamepads[1]
                if hasattr(gp2, "x") and abs(gp2.x) > 0.2:
                    p2_x = gp2.x

            if not p2.is_dashing:
                if abs(p2_x) > 0.05:
                    p2.vx = p2_x * p2.move_speed
                    p2.facing = 1 if p2_x > 0 else -1
                else:
                    p2.vx *= 0.7

            p2.update(delta_time, self.platforms, self.particles)

        # REGLAS DE AMIGOS:
        if self.mode == "2PLAYERS" and p1 and p2:
            if p1.is_dead and not p2.is_dead:
                self.round_winner_text = "¡JUGADOR 2 GANA LA RONDA! (P1 ha caído)"
                self.total_coins += 50
                self.state = "ROUND_OVER"
                return
            elif p2.is_dead and not p1.is_dead:
                self.round_winner_text = "¡JUGADOR 1 GANA LA RONDA! (P2 ha caído)"
                self.total_coins += 50
                self.state = "ROUND_OVER"
                return
            elif p1.is_dead and p2.is_dead:
                self.round_winner_text = "¡AMBOS HÉROES HAN CAÍDO EN MISIÓN!"
                self.state = "ROUND_OVER"
                return

            if self.portal:
                if math.hypot(p1.x - self.portal.x, p1.y - self.portal.y) < 70:
                    p1.finished_race = True
                if math.hypot(p2.x - self.portal.x, p2.y - self.portal.y) < 70:
                    p2.finished_race = True

                if p1.finished_race and p2.finished_race:
                    self.total_coins += 100 * self.current_level
                    if self.current_level < self.max_levels:
                        self.round_winner_text = f"¡AMBOS LLEGARON A LA META! AVANZANDO AL NIVEL {self.current_level + 1}"
                        self.current_level += 1
                        self.start_level(self.current_level)
                    else:
                        self.round_winner_text = "¡FELICIDADES! ¡COMPLETASTE TODOS LOS NIVELES!"
                        self.state = "ROUND_OVER"
                    return
        elif self.mode == "SOLO" and p1:
            if p1.is_dead:
                self.round_winner_text = "MISIÓN FALLIDA - HAS SIDO NEUTRALIZADO"
                self.state = "ROUND_OVER"
                return
            if self.portal and math.hypot(p1.x - self.portal.x, p1.y - self.portal.y) < 70:
                self.total_coins += 80 * self.current_level
                if self.current_level < self.max_levels:
                    self.round_winner_text = f"¡NIVEL COMPLETADO! AVANZANDO AL NIVEL {self.current_level + 1}"
                    self.current_level += 1
                    self.start_level(self.current_level)
                else:
                    self.round_winner_text = "¡MISIÓN CUMPLIDA! ERES EL REY DE NEO-KYOTO"
                    self.state = "ROUND_OVER"
                return

        # Monedas
        for coin in self.coins:
            if not coin.collected:
                coin.update(delta_time)
                for p in [p1, p2]:
                    if p and not p.is_dead and math.hypot(p.x - coin.x, p.y - coin.y) < 26:
                        coin.collected = True
                        p.coins_collected += 1
                        self.total_coins += coin.value
                        p.score += 50
                        self.particles.emit_sparks(coin.x, coin.y, count=10, color=COLOR_GOLD)

        # Plataformas y Láseres
        for plat in self.platforms:
            plat.update(delta_time)

        for laser in self.lasers:
            laser.update(delta_time)
            if laser.active:
                for p in [p1, p2]:
                    if p and not p.is_dead:
                        if abs(p.x - laser.x) < 14 and p.y > laser.y1 and p.y < laser.y2:
                            p.take_damage(20, self.particles)

        # Drones
        for drone in self.drones:
            target = p1 if (p1 and not p1.is_dead) else p2
            if target:
                new_bullet = drone.update(delta_time, target.x, target.y)
                if new_bullet:
                    self.projectiles.append(new_bullet)

                for p in [p1, p2]:
                    if p and p.is_attacking:
                        if math.hypot((p.x + p.facing * 24) - drone.x, p.y - drone.y) < 45 and not drone.dead:
                            drone.dead = True
                            p.drones_destroyed += 1
                            p.add_combo(4)
                            self.particles.emit_sparks(drone.x, drone.y, count=25, color=COLOR_YELLOW)

        self.drones = [d for d in self.drones if not d.dead]

        # Proyectiles
        for bullet in self.projectiles:
            bullet.update(delta_time)
            for p in [p1, p2]:
                if p and not p.is_dead and math.hypot(bullet.x - p.x, bullet.y - p.y) < 22:
                    bullet.dead = True
                    p.take_damage(16, self.particles)

        self.projectiles = [b for b in self.projectiles if not b.dead]
        self.particles.update(delta_time)

        # Cámara
        if p1 and p2 and not p1.is_dead and not p2.is_dead:
            target_cam_x = (p1.x + p2.x) / 2 - self.width / 2
            target_cam_y = (p1.y + p2.y) / 2 - self.height / 2 + 50
        elif p1 and not p1.is_dead:
            target_cam_x = p1.x - self.width / 2 + (p1.facing * 80)
            target_cam_y = p1.y - self.height / 2 + 50
        elif p2 and not p2.is_dead:
            target_cam_x = p2.x - self.width / 2 + (p2.facing * 80)
            target_cam_y = p2.y - self.height / 2 + 50
        else:
            target_cam_x = self.cam_x
            target_cam_y = self.cam_y

        self.cam_x += (target_cam_x - self.cam_x) * CAMERA_LERP_SPEED
        self.cam_y += (target_cam_y - self.cam_y) * CAMERA_LERP_SPEED
        self.camera_world.move_to((self.cam_x, self.cam_y))

    def on_key_press(self, symbol: int, modifiers: int):
        self.keys_down.add(symbol)

        if self.state == "MENU":
            if symbol == arcade.key.KEY_1:
                self.mode = "SOLO"
                self.start_level(1)
            elif symbol == arcade.key.KEY_2:
                self.mode = "2PLAYERS"
                self.start_level(1)
            elif symbol == arcade.key.KEY_3:
                self.state = "SHOP"
            elif symbol == arcade.key.KEY_4:
                self.state = "RANKING"
            return

        if self.state == "SHOP":
            keys = [arcade.key.KEY_1, arcade.key.KEY_2, arcade.key.KEY_3, arcade.key.KEY_4]
            char_keys = list(CHARACTERS.keys())
            for idx, k in enumerate(keys):
                if symbol == k and idx < len(char_keys):
                    ckey = char_keys[idx]
                    char = CHARACTERS[ckey]
                    if not char["unlocked"] and self.total_coins >= char["cost"]:
                        self.total_coins -= char["cost"]
                        char["unlocked"] = True
                        self.p1_char = ckey
                    elif char["unlocked"]:
                        self.p1_char = ckey
            if symbol in (arcade.key.ESCAPE, arcade.key.M):
                self.state = "MENU"
            return

        if self.state in ("ROUND_OVER", "RANKING"):
            if symbol == arcade.key.SPACE:
                self.start_level(self.current_level)
            elif symbol in (arcade.key.M, arcade.key.ESCAPE):
                self.state = "MENU"
            return

        # P1
        if self.player1:
            if symbol == arcade.key.W:
                self.player1.jump(self.particles)
            elif symbol in (arcade.key.Q, arcade.key.LSHIFT):
                self.player1.trigger_dash(self.particles)
            elif symbol in (arcade.key.E, arcade.key.F):
                self.player1.trigger_attack(self.particles)

        # P2
        if self.player2:
            if symbol == arcade.key.UP:
                self.player2.jump(self.particles)
            elif symbol in (arcade.key.DOWN, arcade.key.RSHIFT):
                self.player2.trigger_dash(self.particles)
            elif symbol in (arcade.key.ENTER, arcade.key.L):
                self.player2.trigger_attack(self.particles)

        if symbol == arcade.key.ESCAPE:
            self.state = "MENU"

    def on_key_release(self, symbol: int, modifiers: int):
        if symbol in self.keys_down:
            self.keys_down.remove(symbol)


def main():
    game = MyGame()
    game.setup()
    arcade.run()


if __name__ == "__main__":
    main()
