# Second profile campaign: for each guest profile (GHL tags profile_*), the blog article closest to it,
# the retreats at the Finca and a clear place to book a discovery call. No medical or substance details
# in the email itself: each one speaks to what the group is looking for.
# Run: python3 worker/emails/campaigns/blogs.py [--today YYYY-MM-DD]
import os
from profiles import w, dates, ideas, calendar_link, ES_PAGE, ES_SIGN, ES_FOOT, ES_CALL, ES_WA

HERE = os.path.dirname(os.path.abspath(__file__))
BLOG = w.SITE + '/blog/'
ES_BLOG = w.SITE + '/es/blog/'


# Blog covers are hosted in the GHL media library (the site copies in public/email/web go live on the next deploy).
COVERS = {
 "blog-ayahuasca-and-grief": "https://files.leadconnectorhq.com/file/6b07171a7f4b143c88b323cf/email-blog-ayahuasca-and-grief.jpg",
 "blog-ayahuasca-and-spirituality": "https://files.leadconnectorhq.com/file/6b07171a98d80ae21c82fe21/email-blog-ayahuasca-and-spirituality.jpg",
 "blog-ayahuasca-ego-death": "https://files.leadconnectorhq.com/file/6b07171b7c73288beecd2202/email-blog-ayahuasca-ego-death.jpg",
 "blog-ayahuasca-for-addiction": "https://files.leadconnectorhq.com/file/6b07171b7c73288beecd2223/email-blog-ayahuasca-for-addiction.jpg",
 "blog-maria-sabina-mushroom-velada": "https://files.leadconnectorhq.com/file/6b07171c3a3fbd26c29424cc/email-blog-maria-sabina-mushroom-velada.jpg",
 "blog-retreat-for-nurses-burnout": "https://files.leadconnectorhq.com/file/6b07171c3a3fbd26c29424ec/email-blog-retreat-for-nurses-burnout.jpg",
 "blog-womens-psilocybin-retreat": "https://files.leadconnectorhq.com/file/6b07171d514e625d6a8d96a6/email-blog-womens-psilocybin-retreat.jpg"
}


def article(img, alt, title, teaser, href, es=False):
    """The blog article: cover, title, two lines and a button."""
    pic = w.photo(img, alt).replace(f'{w.IMG}{img}.jpg', COVERS.get(img, f'{w.IMG}{img}.jpg'))
    return (pic
            + w.section(w.label('DEL BLOG' if es else 'FROM OUR BLOG') + w.h2(f'<a href="{href}" style="color:#000000;text-decoration:none;">{title}</a>')
                        + teaser + w.button('Leer el artículo' if es else 'Read the article', href)))


def finca(intro, medicines, n=4, es=False):
    """What a week at the Finca includes, then the next dates."""
    if es:
        facts = ideas([('Siete días, grupo pequeño', 'Hasta 15 personas. Ceremonias de ayahuasca con Humberto o de psilocibina con Krista, más una de Satori.'),
                       ('Todo incluido', 'Hospedaje, comida limpia hecha en la Finca, temazcal, yoga y círculos de integración. Desde $1,850 USD por persona.'),
                       ('Te preparamos', 'Revisión médica antes de confirmar, guía de preparación y acompañamiento después del retiro.')])
        return w.section(w.label('RETIROS EN FINCA EL PÉNDULO') + w.h2('Una semana en la Finca') + w.p(intro, mb=24) + facts
                         + w.label('PRÓXIMAS FECHAS') + dates(medicines, n=n, es=True) + calendar_link(es=True), bg='#f5f3ee')
    facts = ideas([('Seven days, a small group', 'Up to 15 guests. Ayahuasca with Humberto or psilocybin with Krista, plus one Satori ceremony.'),
                   ('Everything included', 'Your room, clean food cooked at the Finca, temazcal, yoga and integration circles. From $1,850 USD per person.'),
                   ('We prepare you', 'A medical review before we confirm, a preparation guide and support after you go home.')])
    return w.section(w.label('RETREATS AT FINCA EL PÉNDULO') + w.h2('A week at the Finca') + w.p(intro, mb=24) + facts
                     + w.label('NEXT DATES') + dates(medicines, n=n) + calendar_link(), bg='#f5f3ee')


def call(title, text, es=False):
    """The discovery call, on its own block so it is easy to find."""
    if es:
        return w.section(w.label('AGENDA UNA LLAMADA', color=w.OCHRE) + w.h2(title, color='#ffffff') + w.p(text, color='#ffffff', mb=10)
                         + w.p('Llamada gratuita de 30 minutos por Google Meet, en español. Tú eliges el día y la hora.', color='#ffffff', size=15, mb=24)
                         + w.button('Agendar mi llamada', ES_CALL, dark=True)
                         + w.p(f'¿Prefieres escribir? <a href="{ES_WA}" style="color:#ffffff;">Mándanos un WhatsApp</a>.', color='#ffffff', size=15, mb=0).replace('margin:0 0 0px', 'margin:20px 0 0'),
                         bg=w.FOREST)
    return w.section(w.label('BOOK A CALL', color=w.OCHRE) + w.h2(title, color='#ffffff') + w.p(text, color='#ffffff', mb=10)
                     + w.p('A free 30-minute video call with our team. You pick the day and time.', color='#ffffff', size=15, mb=24)
                     + w.button('Book my free call', w.CALL, dark=True)
                     + w.p(f'Prefer to write? <a href="{w.WA}" style="color:#ffffff;">Message us on WhatsApp</a>.', color='#ffffff', size=15, mb=0).replace('margin:0 0 0px', 'margin:20px 0 0'),
                     bg=w.FOREST)


MES = dict(zip(['January','February','March','April','May','June','July','August','September','October','November','December'],
               ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']))
ES_GUIDE = {'With Sitka Healing House': 'Con Sitka Healing House', 'Retreat, ceremony or celebration': 'Retiro, ceremonia o celebración',
            'Holy Week, with the Medicine and Music Festival': 'Semana Santa, con el Festival de Medicina y Música'}

def es_dates(html):
    """Calendar rows in Spanish: '16 al 22 de enero de 2027 · Con Humberto'."""
    import re
    M = '|'.join(MES)
    html = re.sub(rf'({M}) (\d+), (\d{{4}}) - ({M}) (\d+), (\d{{4}})', lambda m: f'{m[2]} de {MES[m[1]]} de {m[3]} al {m[5]} de {MES[m[4]]} de {m[6]}', html)
    html = re.sub(rf'({M}) (\d+) - ({M}) (\d+), (\d{{4}})', lambda m: f'{m[2]} de {MES[m[1]]} al {m[4]} de {MES[m[3]]} de {m[5]}', html)
    html = re.sub(rf'({M}) (\d+)-(\d+), (\d{{4}})', lambda m: f'{m[2]} al {m[3]} de {MES[m[1]]} de {m[4]}', html)
    for en, es in ES_GUIDE.items():
        html = html.replace(f'&middot; {en}<', f'&middot; {es}<')
    import re as _r
    return _r.sub(r'&middot; With (\w+)<', r'&middot; Con \1<', html)


AYA_PSI = ('ayahuasca', 'psilocybin')
N = {}

# 1 · Healing Seeker -> Ayahuasca and grief
N['01-healing-seeker'] = ('profile_healing_seeker', 'What do we do with what we carry?', 'Blog campaign - Profile 1 Healing Seeker',
  w.head('What do we do with what we carry?', 'A new article on grief as inner work, and the 2027 retreats at the Finca.')
  + w.hero('fire-circle-at-night', 'Guests gathered around the fire at night', 'A NEW ARTICLE FOR YOU', 'What do we do with what we carry?', 'Some things are not meant to be fixed, only carried with more care.')
  + w.section(w.p('Many of the people who come to the Finca are carrying something: a loss, an old sadness, a weight that never got a name.', mb=16)
     + w.p('We wrote about that this month. Not as a problem to solve, but as something you can go through with others beside you.', mb=0))
  + article('blog-ayahuasca-and-grief', 'Marigolds in warm afternoon light', 'Grieving as inner work',
            w.p('What people describe in ceremony after a loss, what the research found, and how to carry it home with tenderness instead of hurry.', mb=24),
            BLOG + 'ayahuasca-and-grief')
  + finca('If you feel it is time to set something down, this is what a week with us looks like.', AYA_PSI)
  + call('Not sure if it is the right moment?', 'Tell us where you are. We will listen, answer your questions and help you decide, with no pressure.')
  + w.section(w.p('Be gentle with yourself. We are here when you need us.', mb=22) + w.sign())
  + w.foot())

# 2 · Crossroads -> Ayahuasca and spirituality
N['02-crossroads'] = ('profile_crossroads', 'The opening of consciousness', 'Blog campaign - Profile 2 Crossroads',
  w.head('The opening of consciousness', 'What traditions and thinkers say about it, how to live it at home, and the 2027 retreats.')
  + w.hero('web-riders', 'Guests riding through the fields around the Finca', 'A NEW ARTICLE FOR YOU', 'The opening of consciousness', 'When life asks for a new direction, it helps to look inward first.')
  + w.section(w.p('Turning points have a way of asking big questions. Who am I now? What matters? Where do I go from here?', mb=16)
     + w.p('This month we wrote about what traditions, thinkers and guests call the opening of consciousness, and how to turn it into a daily practice.', mb=0))
  + article('blog-ayahuasca-and-spirituality', 'Morning sunlight through mist between tall trees', 'The opening of consciousness',
            w.p('Plant teachers in the Amazon, what researchers have described, and the part that matters most: how to bring that opening home.', mb=24),
            BLOG + 'ayahuasca-and-spirituality')
  + finca('A week away from the noise, in nature and in a small circle, to listen to what comes next.', ('wellness', 'ayahuasca', 'psilocybin'))
  + call('Wondering if this is your next step?', 'Tell us what is changing in your life. We will help you see whether a retreat fits this moment, and which one.')
  + w.section(w.p('Whatever this chapter holds, you do not have to walk it alone.', mb=22) + w.sign())
  + w.foot())

# 3 · Pattern Breaker -> Ayahuasca for addiction (framed as breaking a pattern)
N['03-pattern-breaker'] = ('profile_pattern_breaker', 'Behind every pattern, a thirst', 'Blog campaign - Profile 3 Pattern Breaker',
  w.head('Behind every pattern, a thirst', 'Stories, science and the spirit of breaking a cycle, and the 2027 retreats.')
  + w.hero('sitka-morning-stretch', 'Guests stretching together in the morning', 'A NEW ARTICLE FOR YOU', 'Behind every pattern, a thirst', 'Not why the habit, but what it was trying to give you.')
  + w.section(w.p('Carl Jung once wrote that a craving can be a thirst for wholeness in disguise. Gabor Maté asks the same question in other words: not why the habit, but why the pain.', mb=16)
     + w.p('We gathered their ideas, and the words of people who broke a long cycle, in a new article.', mb=0))
  + article('blog-ayahuasca-for-addiction', 'A moss-covered vine twisting among green plants', 'Stories, science and the spirit',
            w.p('What people who changed a pattern describe, what small studies found and where they stop, and why the real work starts after the ceremony.', mb=24),
            BLOG + 'ayahuasca-for-addiction')
  + finca('Early mornings, clean food, nature and a group walking the same way. Seven days to remember what you are capable of.', AYA_PSI)
  + call('Ready to talk about it?', 'A private conversation with our team about what you want to change and whether a retreat can help.')
  + w.section(w.p('One step at a time. We are cheering for you.', mb=22) + w.sign())
  + w.foot())

# 4 · Returning Journeyer -> Ayahuasca ego death
N['04-returning-journeyer'] = ('profile_returning_journeyer', 'When the self dissolves', 'Blog campaign - Profile 4 Returning Journeyer',
  w.head('When the self dissolves', 'A new article for those who have sat in ceremony, and the 2027 dates at the Finca.')
  + w.hero('web-group-yoga-oracle', 'A group moving together at the Oracle', 'FOR OUR COMMUNITY', 'When the self dissolves', 'A new article for those who have already sat in the circle.')
  + w.section(w.p('You have sat with the medicine. Maybe you met the night when the usual sense of "I" falls away, or heard someone describe it at breakfast the next morning.', mb=16)
     + w.p('We wrote about it for people who know the ceremony: what dissolves, what a 2023 study of experienced drinkers found, and what to do with it once you are back home.', mb=0))
  + article('blog-ayahuasca-ego-death', 'Smoke and soft light inside the ceremony hut', 'What dissolving the self means',
            w.p('Why ego death is meaningful but not the goal, the difference between dissolution and inflation, and how to integrate it.', mb=24),
            BLOG + 'ayahuasca-ego-death')
  + finca('Ayahuasca with Humberto, psilocybin with Krista, and Familia Sagrada during Holy Week with the Medicine and Music Festival.', ('ayahuasca', 'psilocybin', 'familia-sagrada'), n=5)
  + call('Ready to return?', 'Let us help you choose the retreat and medicine that fit where you are now.')
  + w.section(w.p('Thank you for being part of this community. We hope to see you in the circle again.', mb=22) + w.sign())
  + w.foot())

# 5 · Caregiver -> A retreat for nurses, burnout and all
N['05-caregiver'] = ('profile_caregiver', 'A week of being held', 'Blog campaign - Profile 5 Caregiver',
  w.head('A week of being held', 'For those who care for others all day: a new article and the 2027 retreats.')
  + w.hero('sitka-long-dinner', 'Guests sharing a long dinner at the Finca', 'FOR THOSE WHO CARE FOR OTHERS', 'A week of being held', 'For once, someone else holds the space.')
  + w.section(w.p('Nurses, therapists, teachers, parents, counselors. Many of our guests spend their days looking after others and go home with nothing left.', mb=16)
     + w.p('This month we wrote for them: why caregivers find it so hard to receive care, and what a week of being looked after can give back.', mb=0))
  + article('blog-retreat-for-nurses-burnout', 'A massage table made up with white towels in a treatment room at the Finca', 'A retreat for those who give care',
            w.p('Compassion fatigue, reconnecting with why you chose this work, and what a held week at the Finca looks like.', mb=24),
            BLOG + 'retreat-for-nurses-burnout')
  + finca('Every meal, every ceremony and every detail taken care of, so you only have to show up.', ('wellness', 'ayahuasca', 'psilocybin'))
  + call('Let us take care of the planning', 'Tell us how you are and what you need. We will help you find the week that fits, and answer every question.')
  + w.section(w.p('You give so much. Let it come back to you.', mb=22) + w.sign())
  + w.foot())

# 6 · Psilocybin-Curious Woman -> María Sabina and the mushroom velada
N['06-psilocybin-curious'] = ('profile_psilocybin_curious', 'Where the mushroom ceremony began', 'Blog campaign - Profile 6 Psilocybin Curious',
  w.head('Where the mushroom ceremony began', 'María Sabina, the Mazatec velada, and the 2027 psilocybin retreats with Krista.')
  + w.hero('women-long-dinner', 'Women sharing a long dinner by candlelight', 'A NEW ARTICLE FOR YOU', 'Where the mushroom ceremony began', 'The woman who carried the velada, and what we learn from her.')
  + w.section(w.p('Long before retreats, there was a woman in the mountains of Oaxaca who sang through the night with the mushrooms to heal the people who came to her.', mb=16)
     + w.p('This month we wrote about María Sabina, what a velada is, and how we honor that tradition in our own ceremonies.', mb=0))
  + article('blog-maria-sabina-mushroom-velada', 'A Psilocybe mexicana mushroom growing among grass and green leaves', 'María Sabina and the mushroom velada',
            w.p('Who the wise woman of Huautla was, why the ceremony happens at night, what changed after 1955, and what it means to approach the mushrooms with respect.', mb=24),
            BLOG + 'maria-sabina-mushroom-velada')
  + finca('Our psilocybin retreats are led by Krista, with a calm rhythm and time in nature between ceremonies.', ('psilocybin',))
  + call('Questions about psilocybin?', 'Ask us anything about the medicine, the group and how we prepare you.')
  + w.section(w.p('We would love to sit in circle with you.', mb=22) + w.sign())
  + w.foot())

# 7 · Local Seeker (Spanish) -> the calendar only
N['07-local-seeker'] = ('profile_local_seeker', 'Las fechas de 2027 en la Finca', 'Blog campaign - Perfil 7 Local Seeker (ES)',
  w.head('Las fechas de 2027 en la Finca', 'Año Nuevo, Semana Santa y los retiros de 2027 en Jalisco.').replace('<html lang="en">', '<html lang="es">')
  + w.hero('web-temazcal-smudging', 'Ceremonia de sahumerio antes del temazcal', 'FINCA EL PÉNDULO &middot; JALISCO', 'Las fechas de 2027 en la Finca', 'A una hora de Guadalajara, en Tepatitlán.')
  + w.section(w.label('CALENDARIO') + w.h2('Próximos retiros') + w.p('Siete días en grupo pequeño, con hospedaje, comida y ceremonias incluidos. En Semana Santa, Familia Sagrada con el Festival de Medicina y Música.', mb=20)
     + dates(('newyear', 'wellness', 'ayahuasca', 'psilocybin', 'familia-sagrada'), n=9, es=True) + calendar_link(es=True))
  + call('Platiquemos', 'Cuéntanos qué buscas y te ayudamos a ver qué retiro va contigo.', es=True)
  + w.section(w.p('Te esperamos en casa.', mb=22) + ES_SIGN)
  + ES_FOOT)

N['07-local-seeker'] = N['07-local-seeker'][:3] + (es_dates(N['07-local-seeker'][3]),)

if __name__ == '__main__':
    for name, (tag, subject, ghl_name, html) in N.items():
        open(os.path.join(HERE, 'blog-' + name + '.html'), 'w').write(html)
        print(f'{name}: tag {tag}, subject: {subject}')
