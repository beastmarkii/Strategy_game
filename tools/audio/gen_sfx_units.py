"""1944 전선 사령부 — 병종별·진영별 효과음 생성 (ElevenLabs 직결 sound-generation).

gen_sfx.py 는 "무엇이 굴러가고 무엇이 터지는가"만 나눴다. 그 결과 공병대가 보병의
군화 소리로 걷고, 대대사령부가 소총으로 응사하고, 독일군 전차가 미제 75mm 소리를
냈다. 목소리는 진영별로 갈라 놓고 총소리는 미제인 것은 앞뒤가 안 맞는다.

두 축으로 가른다.

  병종  — 무엇이 움직이고 무엇이 쏘고 무엇이 터지는가.
          공병은 삽을 지고 걷고, 자주포는 전차보다 가벼운 궤도로 굴러간다.
  진영  — 사격음에만 건다. 총은 나라마다 소리가 다르지만(MG42의 톱질 소리는
          한 번 들으면 잊히지 않는다) 궤도가 굴러가는 소리와 포탄이 터지는 소리에는
          국적이 없다. 이동·파괴를 진영별로 또 나누면 파일만 두 배가 되고
          플레이어는 차이를 못 듣는다.

이미 통과한 gen_sfx.py 의 소리는 여기서 다시 뽑지 않는다.

하드룰: Pikaso/Magnific 커넥터는 프로덕션 금지. api.elevenlabs.io 직결만 쓴다.
키는 절대 출력하지 않는다.
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
# 변주 둘의 prompt_influence를 다르게 주면 같은 프롬프트에서도 결이 갈린다.
JOBS = [
    # ── 이동: 병종만 가른다 ──────────────────────────────────────────────
    # 공병은 보병 군화 소리를 빌려 쓰고 있었다. 이 부대는 연장을 지고 다니는
    # 일꾼이므로, 발소리 위에 삽과 곡괭이가 배낭에 부딪히는 소리가 얹혀야 한다.
    ("move_engineer_1",
     "combat engineers marching, boots on dirt, shovels and pickaxes knocking against packs, "
     "loose metal tools clinking with every step, close perspective", 2, 0.45),
    ("move_engineer_2",
     "sappers moving up a track carrying timber and entrenching tools, wooden stakes knocking together, "
     "spades rattling on webbing, boots crunching gravel", 2, 0.6),

    # 자주포는 전차 궤도 소리를 그대로 쓰고 있었다. 훨씬 가벼운 차체에 얇은 궤도라
    # 소리가 높고 빠르다 — 그래야 전차와 구분이 된다.
    ("move_spart_1",
     "light tracked self-propelled gun driving quickly, thin steel tracks slapping and pattering, "
     "high revving petrol engine, lighter and faster than a tank, close exterior", 3, 0.45),
    ("move_spart_2",
     "small tracked gun carriage moving at speed over hard ground, quick rattling track links, "
     "whining engine under load, no deep diesel rumble", 3, 0.6),

    # ── 미군 사격: 병종별 ────────────────────────────────────────────────
    # 공병은 소총분대와 같은 일제사격 소리를 냈다. 공병은 카빈과 기관단총을 드는
    # 소수 인원이므로, 짧고 가볍고 사람 수가 적게 들려야 한다.
    ("attack_carbine_1",
     "two or three American M1 carbines firing quickly, light sharp cracks, few shooters, "
     "open ground, short echo", 2, 0.45),
    ("attack_carbine_2",
     "a Thompson submachine gun fires a short burst and a carbine answers twice, "
     "close range small arms, dry outdoor echo", 2, 0.6),

    # 대대사령부도 소총 소리를 냈다. 지휘소가 스스로를 지키는 소리여야 한다 —
    # 권총과 기관단총, 사람 수가 아주 적은.
    ("attack_sidearm_1",
     "an American .45 pistol fires three heavy deliberate shots, deep thumping report, "
     "close, indoor-to-outdoor echo of a command post", 2, 0.45),
    ("attack_sidearm_2",
     "a pistol fires twice and a Thompson submachine gun answers with a very short burst, "
     "defensive fire from a headquarters position, close and dry", 2, 0.6),

    # 자주포는 야포와 같은 곡사포 소리를 냈다. 자주포는 차체 위에서 쏘므로
    # 포성 뒤에 강철 차체가 울리는 금속음이 따라붙고, 견인포보다 짧게 끝난다.
    ("attack_spg_1",
     "a self-propelled howitzer fires from an armoured hull, hard cracking blast followed by "
     "the steel hull ringing, breech clanging open, shorter echo than a towed gun", 3, 0.45),
    ("attack_spg_2",
     "assault gun fires a single round, sharp concussive report with metallic hull resonance, "
     "spent case clattering inside the fighting compartment", 3, 0.6),

    # ── 독일군 사격: 같은 병종, 다른 무기 ───────────────────────────────
    # MG42는 분당 1200발이라 낱발이 안 들리고 천을 찢는 듯한 소리로 뭉쳐 들린다.
    # 이 소리 하나로 "지금 쏘는 쪽이 독일군"임이 즉시 구분된다.
    ("axis_attack_rifle_1",
     "German MG42 machine gun fires a long ripping burst, extremely high rate of fire like tearing canvas, "
     "individual shots indistinguishable, open field echo", 2, 0.5),
    ("axis_attack_rifle_2",
     "a German MG42 rips a short buzzing burst and two Kar98k bolt-action rifles crack in answer, "
     "German infantry position, rolling echo", 2, 0.6),

    # MP40은 분당 500발로 느리다. 미군 톰슨보다 낮고 규칙적으로 툭툭 끊긴다.
    ("axis_attack_carbine_1",
     "a German MP40 submachine gun fires a slow deliberate burst, low rate of fire, "
     "distinct thumping individual shots, close range outdoors", 2, 0.45),
    # 처음 프롬프트는 "짧고 낮게"만 적었더니 통째로 0.5초짜리 딸깍음이 나왔다.
    # 몇 발을 어떤 간격으로 쏘는지, 그리고 소리가 끝까지 이어진다는 것을 적어야
    # 모델이 앞뒤를 무음으로 채우지 않는다.
    ("axis_attack_carbine_2",
     "German MP40 machine pistol fires a long slow burst of ten rounds, blunt low thumping shots "
     "clearly spaced apart, firing continuously for the whole clip, dry open air with a short echo "
     "after every shot", 2, 0.6),

    ("axis_attack_sidearm_1",
     "a German Luger pistol fires five sharp snapping shots spaced half a second apart, each shot "
     "followed by an echo off nearby walls, continuous sequence with no silence", 2, 0.45),
    ("axis_attack_sidearm_2",
     "a German officer's pistol fires twice and an MP40 answers with a very short slow burst, "
     "defensive fire from a headquarters, close and dry", 2, 0.6),

    # 독일 전차포는 초속이 높아 미제 75mm보다 납작하고 사납게 터진다.
    # "flat, very little rumble" 만 적었더니 0.15초짜리 딸깍음이 나왔다. 납작하다는
    # 것은 저음이 적다는 뜻이지 소리가 짧다는 뜻이 아니다 — 메아리 꼬리를 길게
    # 끌고 간다고 분명히 적어야 포성으로 들린다.
    ("axis_attack_tank_1",
     "German high velocity 88mm tank gun fires one round: a violent whip-crack muzzle blast followed "
     "immediately by a long savage echo rolling away across open fields for several seconds, "
     "sound continues to the end of the clip", 3, 0.45),
    ("axis_attack_tank_2",
     "German long barrelled 75mm tank gun fires a single round, hard flat crack, muzzle brake blast, "
     "sharp ringing report and fast decaying echo", 3, 0.6),

    ("axis_attack_howitzer_1",
     "German 105mm field howitzer fires a single shell, deep heavy boom with a hard leading crack, "
     "long thunder rolling over farmland", 3, 0.45),
    ("axis_attack_howitzer_2",
     "German heavy field gun fires, thunderous low blast with metallic breech recoil, "
     "long decaying rumble across a valley", 3, 0.6),

    ("axis_attack_spg_1",
     "a German Sturmgeschütz assault gun fires from a low armoured hull, hard flat crack, "
     "steel superstructure ringing, breech clanging, short echo", 3, 0.45),
    ("axis_attack_spg_2",
     "German self-propelled gun fires one round, sharp concussive report with heavy hull resonance, "
     "shell case clattering on steel floor", 3, 0.6),

    # ── 파괴: 병종만 가른다 ─────────────────────────────────────────────
    # 공병 진지가 날아가면 사람만 흩어지는 것이 아니라 쌓아 둔 자재가 무너진다.
    ("destroy_engineer_1",
     "explosion tears through an engineer work site, blast followed by stacked timber collapsing, "
     "shovels and tools flung clattering across the ground, dust falling", 3, 0.45),
    ("destroy_engineer_2",
     "high explosive shell hits a construction position, sharp blast, wooden beams splintering and "
     "falling, metal tools scattering, debris raining down", 3, 0.6),

    # 사령부가 무너지는 소리는 폭발보다 그 뒤가 중요하다 — 천막이 찢어지고
    # 무전기가 부서지는 소리가 "지휘소가 날아갔다"로 읽힌다.
    ("destroy_hq_1",
     "shell explodes on a command post, blast followed by canvas tent ripping and collapsing, "
     "radio sets smashing, folding tables and papers scattering", 3, 0.45),
    ("destroy_hq_2",
     "headquarters position destroyed, heavy detonation, tent poles snapping, "
     "signal equipment breaking apart, wreckage settling in the dust", 3, 0.6),

    # 야포가 죽으면 옆에 쌓아 둔 포탄이 따라 터진다. 전차 폭발과 달리
    # 큰 한 방 뒤에 작은 폭발이 몇 번 이어져야 탄약 유폭으로 들린다.
    ("destroy_gun_1",
     "artillery position destroyed, huge explosion then stacked shells cooking off in a ragged string "
     "of smaller blasts, gun shield clanging to the ground, fire crackling", 4, 0.45),
    ("destroy_gun_2",
     "field gun and its ammunition dump detonate, enormous blast followed by several secondary explosions, "
     "twisted metal crashing down, flames roaring", 4, 0.6),
]


def gen(name, prompt, seconds, influence):
    dest = OUT / f"{name}.mp3"
    r = requests.post(
        URL,
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={"text": prompt, "duration_seconds": float(seconds), "prompt_influence": influence},
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
    # 이름을 인자로 주면 그것만 다시 뽑는다. 통과한 소리는 건드리지 않는다.
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
