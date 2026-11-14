"""Optional authoring tool: build a static POS lexicon; jieba is not a game dependency."""
import json, collections
from pathlib import Path
import jieba.posseg as pseg
root=Path(__file__).resolve().parents[1]
questions=json.loads((root/'src/data/musicHistory/genres.json').read_text())
counts=collections.defaultdict(collections.Counter)
for q in questions:
    for word,flag in pseg.cut(q['rawAnswer']):
        if word.strip() and len(word)<=12: counts[word][flag]+=1
lexicon={word:counts[word].most_common(1)[0][0] for word in sorted(counts)}
terms='埃斯库罗斯 索福克勒斯 欧里庇得斯 狄俄尼索斯 格里高利 奥尔加农 巴黎圣母院 莱奥南 佩罗坦 维特里 马肖 兰迪尼 维拉尔特 马伦齐奥 杰苏阿尔多 蒙特威尔第 路德宗 卡瓦里埃利 斯卡拉蒂 门德尔松 梅塔斯塔济奥 格鲁克 弗雷斯科巴尔迪 曼海姆乐派 柏辽兹 李斯特 斯托克豪森 梅西安 利盖蒂 潘德雷茨基 勃拉姆斯 韦伯恩 贝尔格 理查 施特劳斯 柴可夫斯基 德彪西 海顿 巴赫 贝多芬 舒伯特 舒曼 肖邦 福雷 格林卡 莫扎特 巴托克 菲尔德 勋伯格 布列兹 凯奇 科雷利 维瓦尔第 奥柏 罗西尼 梅耶贝尔 古希腊 巴洛克 文艺复兴 古典主义 浪漫主义 现代主义 序列主义 十二音技法 有量记谱法 通奏低音 返始咏叹调 格里高利圣咏 克拉苏拉 经文歌 宣叙调 咏叹调 歌唱家 艺术歌曲 四声部 多乐章 单乐章 单声部 低音固定调 等节奏 有量奥尔加农 花唱奥尔加农 微复调'.split()
for word in terms:lexicon[word]='n'
lexicon['集']='v'
(root/'shared/music-lexicon.mjs').write_text('// Static authoring lexicon: jieba POS plus reviewed music terms. No runtime dependency.\nexport const MUSIC_LEXICON='+json.dumps(lexicon,ensure_ascii=False,indent=2)+';\n')
print('Static music POS lexicon:',len(lexicon),'words')
