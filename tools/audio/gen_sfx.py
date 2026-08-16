"""1944 전선 사령부 — 이동·공격·파괴 효과음 생성 (ElevenLabs 직결 sound-generation).

같은 소리가 반복되면 귀가 금방 지치므로, 게임 안에서 자주 나는 것(발소리, 사격)은
변주를 두 개씩 뽑아 번갈아 재생한다. 한 번뿐인 사건(파괴)도 두 개를 둔다 —
한 턴에 여러 부대가 같이 터질 때 겹쳐 들리면 하나의 큰 폭발로 뭉개지기 때문이다.
"""
import os
import pathlib
import sys
import requests

SECRET = pathlib.Path(os.getenv("ELEVENLABS_KEY_FILE", r"C:\Users\LUO\.secrets\Elevenlabs API.txt"))
OUT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "audio" / "raw"
URL = "https://api.elevenlabs.io/v1/sound-generation"


def key():
    env = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if env.startswith("sk_"):
        return env
    return SECRET.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()


# (파일명, 프롬프트, 길이초, prompt_influence)
# prompt_influence를 변주마다 다르게 주면 같은 프롬프트라도 결이 갈린다.
JOBS = [
    ("radio_click", "single short squelch burst of a 1940s field radio handset being keyed, sharp static pop, close mic, dry", 1, 0.6),

    ("move_infantry_1", "a squad of soldiers marching, heavy leather boots on dry dirt road, webbing and rifle slings rattling, close perspective", 2, 0.4),
    ("move_infantry_2", "infantry boots tramping through gravel and loose earth, kit jangling, several men moving together", 2, 0.55),

    ("move_armor_1", "World War Two medium tank moving, steel track links clanking on hard ground, deep diesel engine rumble, close exterior", 3, 0.4),
    ("move_armor_2", "heavy armoured vehicle rolling forward, metal treads grinding over rubble, low engine growl", 3, 0.55),

    # 예전 프롬프트에 'chains rattling'이 들어 있어서 사슬이 딸랑거리는 소리로 들렸다.
    # 견인차의 엔진과 바퀴만 남기고 금속이 서로 부딪히는 표현은 전부 뺀다.
    ("move_artillery_1", "a heavy truck towing a field gun over a rutted dirt road, low labouring engine, thick tyres crunching on gravel, no metal clatter", 2, 0.45),
    ("move_artillery_2", "artillery tractor hauling a gun carriage slowly across soft ground, deep engine load, wheels grinding through mud", 2, 0.6),

    # 대대사령부는 야포와 같은 소리를 쓰고 있었다. 무거운 견인차와 지휘 차량은
    # 무게가 다르므로 소리도 갈라 둔다 — 가볍고 빠르게.
    ("move_hq_1", "a military staff car driving off along a dirt track, light four cylinder engine, tyres on packed earth, close exterior", 2, 0.45),
    ("move_hq_2", "a command jeep pulling away over rough ground, small engine revving briefly, suspension working, dry open air", 2, 0.6),

    # 공사 시작. 한 번에 끝나는 짧은 소리여야 "명령을 받았다"로 읽힌다.
    ("build_start_1", "combat engineers starting work, a shovel biting into hard earth twice and a wooden stake hammered, outdoor, close", 2, 0.45),
    # 'tools handled' 처럼 소리가 약한 표현을 넣었더니 통째로 무음에 가깝게 나왔다.
    # 무엇이 무엇을 때리는지 분명하게 적어야 소리가 실린다.
    ("build_start_2", "a pickaxe strikes hard soil twice and a heavy wooden beam drops onto the ground, loud, close mic, outdoors", 2, 0.55),

    ("attack_rifle_1", "short burst of World War Two bolt-action rifle fire from a squad, three sharp cracks, open field, distant echo", 2, 0.45),
    ("attack_rifle_2", "infantry small arms volley, rifles and a light machine gun firing briefly, crisp cracks with a rolling echo", 2, 0.6),

    ("attack_tank_1", "World War Two tank main gun firing a single round, enormous sharp blast, metallic breech recoil, echo rolling across a field", 3, 0.45),
    ("attack_tank_2", "tank cannon fires once, hard concussive crack with deep low end and a long echo tail", 3, 0.6),

    ("attack_howitzer_1", "heavy field howitzer firing a single shell, immense deep boom, shockwave, long rolling thunder across open ground", 3, 0.45),
    ("attack_howitzer_2", "large artillery piece fires, thunderous low blast, muzzle crack and long decaying echo over a valley", 3, 0.6),

    ("destroy_infantry_1", "artillery shell impact in soft earth, sharp explosion, dirt and gravel raining down, men's gear scattering, close", 3, 0.45),
    ("destroy_infantry_2", "high explosive round detonates in a field position, punchy blast, debris falling, dust settling", 3, 0.6),

    ("destroy_vehicle_1", "armoured vehicle destroyed, huge explosion, ammunition cooking off, torn metal clanging to the ground, fire roaring", 4, 0.45),
    ("destroy_vehicle_2", "tank brews up, massive blast, secondary explosions, heavy metal debris crashing down, crackling flames", 4, 0.6),
]


def gen(name, prompt, seconds, influence):
    dest = OUT / f"{name}.mp3"
    r = requests.post(
        URL,
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={
            "text": prompt,
            "duration_seconds": float(seconds),
            "prompt_influence": influence,
        },
        timeout=300,
    )
    if r.status_code != 200:
        print(f"FAIL {name}: {r.status_code} {r.text[:300]}")
        return False
    dest.write_bytes(r.content)
    print(f"ok {name}.mp3  {len(r.content)} bytes  {seconds}s")
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # 이름을 인자로 주면 그것만 다시 뽑는다. 소리 하나를 고치겠다고 열일곱 개를
    # 통째로 다시 뽑으면 이미 통과한 소리까지 다른 것으로 바뀌어 버린다.
    only = set(sys.argv[1:])
    jobs = [j for j in JOBS if not only or j[0] in only]
    missing = only - {j[0] for j in JOBS}
    if missing:
        print(f"모르는 이름: {', '.join(sorted(missing))}")
        return 1
    ok = 0
    for name, prompt, seconds, influence in jobs:
        if gen(name, prompt, seconds, influence):
            ok += 1
    print(f"\n{ok}/{len(jobs)} generated -> {OUT}")
    return 0 if ok == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
