"""Import the user-approved V2 source; preserve only existing image associations/site styling."""
import json,re,itertools,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root.parent/'本人使用说明书 V2.md'
text=source.read_text()
def clean(s):
 return '\n'.join(line.strip() for line in s.replace('==','').replace('**','').strip().splitlines() if line.strip() and line.strip()!='---')
questions=[]
for match in re.finditer(r'^## Q(\d+)｜([^\n]+)\n(.*?)(?=^## Q\d+｜|^# 四、评分规则)',text,re.M|re.S):
 num,axis,body=match.groups();title=clean(body.split('**A.**')[0])
 options=[dict(letter=l,text=clean(t),scores=[int(n) for n in scores.split(',')]) for l,t,scores in re.findall(r'\*\*([ABCD])\.\*\*\s*(.*?)\s*`\(([^)]+)\)`',body,re.S)]
 assert len(options)==4
 questions.append(dict(id=int(num),title=title,options=options))
assert len(questions)==18
cards=[]
keys=[f'A{a}-B{b}-C{c}' for a in (1,2,3) for b in (1,2,3) for c in (1,2)]
for match in re.finditer(r'^# (\d{2})｜(\S+) (\w+)\n(.*?)(?=^# \d{2}｜|^# 八、产品底线)',text,re.M|re.S):
 num,name,code,body=match.groups();parts=re.split(r'^### ([^\n]+)\n',body,flags=re.M);sections={parts[i]:clean(parts[i+1]) for i in range(1,len(parts),2)}
 cards.append(dict(key=keys[int(num)-1],name=name,code=code,dimensions=clean(parts[0]),os=sections['内心 OS'],description=sections['结果描述'],tips=[line[2:] for line in sections['好友使用说明'].splitlines() if line.startswith('- ')],footer=sections['系统状态'],selfTips=sections['给自己的 Tips']))
assert len(cards)==18 and all(len(c['tips'])==2 for c in cards)
def dump(o):return json.dumps(o,ensure_ascii=False,indent=2)
(root/'src/data/questions.ts').write_text("import type {Question} from './types';\nexport const questions:Question[] = "+dump(questions)+';\n')
(root/'src/data/results.ts').write_text("import type {ResultCard} from './types';\nexport const results = "+dump(cards)+' as const satisfies readonly ResultCard[];\n')
(root/'tests/fixtures/source-scores.json').write_text(dump([o['scores'] for q in questions for o in q['options']])+'\n')
(root/'tests/fixtures/content-v2.json').write_text(dump(dict(questions=questions,cards=cards))+'\n')
# Construct each dimension independently so all 18 fixtures have transparent target scores.
axes=[[i for i,q in enumerate(questions) if any(o['scores'][axis] for o in q['options'])] for axis in range(3)]
assert [len(x) for x in axes]==[6,6,6]
fixtures={}
for card in cards:
 a,b,c=map(int,re.findall(r'\d',card['key']));targets=[{1:-2,2:0,3:2}[a],{1:2,2:0,3:-2}[b],{1:1,2:-1}[c]];answers=[0]*18
 for axis,indexes in enumerate(axes):
  choice=next(combination for combination in itertools.product(range(4),repeat=6) if sum(questions[i]['options'][o]['scores'][axis] for i,o in zip(indexes,combination))==targets[axis])
  for i,o in zip(indexes,choice):answers[i]=o
 fixtures[card['key']]=dict(answers=answers,scores=targets,bars=[math.floor((s+6)/12*100+.5) for s in targets])
(root/'src/data/demoFixtures.ts').write_text("// V2 samples generated from the approved source.\nimport type {ResultKey,DemoFixture} from './types';\nexport const demoFixtures:Record<ResultKey,DemoFixture> = "+dump(fixtures)+';\n')
# Keep both historical preview entry points in sync, without retaining old scoring/configuration.
for name in ['content.js','header-review-content.js']:
 p=root/'design'/name;s=p.read_text();start=s.index('{');end=s.rfind('}');design=json.loads(s[start:end+1]);images={c['key']:c['image'] for c in design['cards']};design['questions']=questions;design['cards']=[dict(c,image=images[c['key']]) for c in cards];design['fixtures']=fixtures;p.write_text(s[:start]+dump(design)+s[end+1:])
print('Imported exact V2 text, 72 single-axis scores, 18 result cards and fixtures.')
