# Builds the website-workflow email templates for GoHighLevel (one HTML file each).
# Same look as newsletter 01: 600px tables, inline styles, MexiSol colours.
# Run: python3 worker/emails/web/build.py [--today YYYY-MM-DD]
# Dates come from src/data/retreats.json; anything that has already ended is left out,
# so rebuilding (and pushing with sync.py) keeps the calendars current.
import json, os, sys
from datetime import date

HERE = os.path.dirname(__file__)
IMG = 'https://mexisol.world/email/web/'
SITE = 'https://mexisol.world'
CALL = SITE + '/book-a-call'
WA = 'https://wa.me/523787900992'
FOREST, OCHRE, SLATE, LINE, MUTED = '#314a34', '#e4a550', '#557b8e', '#d6d6d6', '#5c5c5c'
DISPLAY = "font-family:'Cal Sans','Tenor Sans',Arial,sans-serif;font-weight:400;"

def head(title, preview):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cal+Sans&amp;family=Tenor+Sans&amp;display=swap" rel="stylesheet">
<style>
body {{ margin: 0; padding: 0; background: #f2f2ef; }}
img {{ border: 0; display: block; max-width: 100%; height: auto; }}
a {{ color: {SLATE}; }}
@media (max-width: 620px) {{
.px {{ padding-left: 24px !important; padding-right: 24px !important; }}
.h1 {{ font-size: 38px !important; line-height: 1.05 !important; }}
.h2 {{ font-size: 30px !important; line-height: 1.08 !important; }}
.col {{ display: block !important; width: 100% !important; }}
.col-gap {{ padding: 0 0 12px 0 !important; }}
}}
</style>
</head>
<body style="margin:0;padding:0;background:#f2f2ef;">
<div style="display:none;max-height:0;overflow:hidden;">{preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2ef;">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;font-family:'Tenor Sans',Arial,Helvetica,sans-serif;color:#000000;">
<tr><td class="px" style="padding:14px 32px;border-bottom:1px solid {LINE};font-size:11px;letter-spacing:0.3em;color:{MUTED};">MEXISOL WORLD</td></tr>
'''

def hero(img, alt, eyebrow, title, sub, btn=None, href=None):
    b = button(btn, href, outline=True) if btn else ''
    return f'''<tr><td style="padding:0;"><img src="{IMG}{img}.jpg" width="600" alt="{alt}" style="width:100%;max-width:600px;height:auto;"></td></tr>
<tr><td class="px" style="padding:40px 40px 44px;background:{FOREST};color:#ffffff;">
<img src="{IMG}logo-white.png" width="110" alt="MexiSol World" style="width:110px;height:auto;margin:0 0 24px 0;">
<p style="margin:0 0 12px;font-size:12px;letter-spacing:0.35em;color:{OCHRE};">{eyebrow}</p>
<h1 class="h1" style="margin:0 0 14px;{DISPLAY}font-size:46px;line-height:1.04;color:#ffffff;">{title}</h1>
<p style="margin:0 {'0 26px' if b else ''};font-size:19px;line-height:1.4;color:#ffffff;">{sub}</p>
{b}</td></tr>
'''

def button(label, href, outline=False, dark=False):
    if outline:
        return f'<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid #ffffff;"><a href="{href}" style="display:inline-block;padding:14px 24px;font-size:15px;letter-spacing:0.04em;color:#ffffff;text-decoration:none;">{label}</a></td></tr></table>\n'
    bg, ink = (OCHRE, '#000000') if dark else (FOREST, '#ffffff')
    return f'<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:{bg};"><a href="{href}" style="display:inline-block;padding:15px 26px;font-size:15px;letter-spacing:0.04em;color:{ink};text-decoration:none;">{label}</a></td></tr></table>\n'

def label(text, color=FOREST):
    return f'<p style="margin:0 0 12px;font-size:13px;letter-spacing:0.2em;color:{color};">{text}</p>\n'

def h2(text, color='#000000'):
    return f'<h2 class="h2" style="margin:0 0 20px;{DISPLAY}font-size:34px;line-height:1.08;color:{color};">{text}</h2>\n'

def p(text, color='#000000', size=17, mb=16):
    return f'<p style="margin:0 0 {mb}px;font-size:{size}px;line-height:1.6;color:{color};">{text}</p>\n'

def section(inner, bg=None, top_line=False, align='left'):
    style = f'padding:48px 48px 48px;' + (f'background:{bg};' if bg else '') + (f'border-top:1px solid {LINE};' if top_line else '')
    return f'<tr><td class="px" align="{align}" style="{style}">\n{inner}</td></tr>\n'

def photo(img, alt):
    return f'<tr><td style="padding:0;"><img src="{IMG}{img}.jpg" width="600" alt="{alt}" style="width:100%;max-width:600px;height:auto;"></td></tr>\n'

def two_photos(a, alta, b, altb):
    return f'''<tr><td class="px" style="padding:0 24px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="col col-gap" width="50%" valign="top" style="padding:0 6px 0 0;"><img src="{IMG}{a}.jpg" width="270" alt="{alta}" style="width:100%;height:auto;"></td>
<td class="col" width="50%" valign="top" style="padding:0 0 0 6px;"><img src="{IMG}{b}.jpg" width="270" alt="{altb}" style="width:100%;height:auto;"></td>
</tr></table>
</td></tr>
'''

def rows(items):
    """items: (title, detail, href) rows with hairlines, like the newsletter's link list."""
    out = f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid {LINE};">\n'
    for t, d, h in items:
        t_html = f'<a href="{h}" style="color:#000000;text-decoration:none;">{t} &rarr;</a>' if h else t
        out += f'<tr><td style="padding:16px 0;border-top:1px solid {LINE};"><span style="{DISPLAY}font-size:20px;">{t_html}</span><br><span style="font-size:14px;color:{MUTED};">{d}</span></td></tr>\n'
    return out + '</table>\n'

def quote(text, who):
    return f'<p style="margin:0 0 6px;{DISPLAY}font-size:22px;line-height:1.3;">&ldquo;{text}&rdquo;</p>\n<p style="margin:0 0 22px;font-size:13px;color:{MUTED};">{who}</p>\n'

def sign(text='With love,'):
    return p(text, mb=4) + f'<p style="margin:0;{DISPLAY}font-size:20px;line-height:1.3;">Humberto, Krista, Marina &amp; the MexiSol World team</p>\n'

def foot():
    return f'''<tr><td class="px" align="center" style="padding:44px 40px;background:{FOREST};color:#ffffff;">
<img src="{IMG}logo-white.png" width="110" alt="MexiSol World" style="width:110px;height:auto;margin:0 auto 22px;">
<p style="margin:0 0 22px;font-size:12px;letter-spacing:0.15em;line-height:2;">
<a href="{SITE}/upcoming-retreats" style="color:#ffffff;text-decoration:none;">RETREATS</a>&nbsp;&nbsp;&nbsp;
<a href="https://www.instagram.com/mexisol.world/" style="color:#ffffff;text-decoration:none;">INSTAGRAM</a>&nbsp;&nbsp;&nbsp;
<a href="{WA}" style="color:#ffffff;text-decoration:none;">WHATSAPP</a>&nbsp;&nbsp;&nbsp;
<a href="{SITE}" style="color:#ffffff;text-decoration:none;">WEBSITE</a>
</p>
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#ffffff;">Finca El P&eacute;ndulo &middot; Camino al Saucillo 861, Tepatitl&aacute;n de Morelos, Jalisco, M&eacute;xico</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#ffffff;"><a href="{{{{email.unsubscribe_link}}}}" style="display:inline-block;margin-top:8px;padding:10px 22px;border:1px solid #ffffff;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:0.12em;">UNSUBSCRIBE</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
'''

# ---------- data for the calendar ----------
data = json.load(open(os.path.join(HERE, '../../../src/data/retreats.json')))
M = ['January','February','March','April','May','June','July','August','September','October','November','December']
def rng(a, b):
    ya, ma, da = map(int, a.split('-')); yb, mb, db = map(int, b.split('-'))
    return f'{M[ma-1]} {da}-{db}' if ma == mb else f'{M[ma-1]} {da} - {M[mb-1]} {db}'
def when(r):
    """'January 16-22, 2027', or 'December 28, 2026 - January 2, 2027' across the new year."""
    if r['start'][:4] != r['end'][:4]:
        ya, ma, da = map(int, r['start'].split('-')); yb, mb, db = map(int, r['end'].split('-'))
        return f'{M[ma-1]} {da}, {ya} - {M[mb-1]} {db}, {yb}'
    return f"{rng(r['start'], r['end'])}, {r['start'][:4]}"
PAGE = {'ayahuasca': '/ayahuasca-retreat', 'psilocybin': '/psilocybin-retreat', 'wellness': '/sitka-sol-wellness-retreat', 'women': '/es/retiro-de-mujeres', 'newyear': '/new-year-retreat', 'familia-sagrada': '/finca-el-pendulo'}
def guide(r):
    g = r.get('guide', '').split('·')
    g = [x.strip() for x in g if x.strip().lower().startswith('with ')]
    return g[0] if g else r.get('guide', '')
TODAY = sys.argv[sys.argv.index('--today') + 1] if '--today' in sys.argv else date.today().isoformat()
YEAR = data['year']
finca_next = [r for r in data['finca'] if r['start'] > TODAY]    # not started yet: can still be booked
finca_cal = [r for r in data['finca'] if r['end'] >= TODAY]      # calendar: everything not over
intl = [r for r in data['international'] if r['end'] >= TODAY]

templates = {}

# 1. Request for information (website form) -- uses the retreat fields the form saves.
templates['01-request-info'] = ('Thank you, {{contact.first_name}}. Here is what comes next',
  head('Your retreat request', 'Your retreat details, upcoming dates and how booking works.')
  + hero('aerial-agave-rows-and-cabins', 'Agave fields and palapa cabins at Finca El Péndulo from the air', 'THANK YOU FOR WRITING', 'Hi {{contact.first_name}}, we got your message', 'One of us will reply personally within a day or two.')
  + section(label('WHO WE ARE') + p('MexiSol World grew around Finca El Péndulo, 14 acres of countryside in Tepatitlán, Jalisco, about an hour from Guadalajara airport. Since 2017 more than 500 people have sat in ceremony with us. Humberto leads our ayahuasca ceremonies, Krista our psilocybin work, and Marina looks after the land and everyone on it. Groups are small, up to 15 guests.', mb=0))
  + photo('web-osho-hut-altar', 'Candles and flowers on the altar inside the Osho Hut')
  + section(label('THE RETREAT YOU ASKED ABOUT') + h2('{{contact.retreat_name}}') + f'<p style="margin:0 0 16px;font-size:15px;color:{MUTED};">{{{{contact.retreat_dates}}}} &nbsp; {{{{contact.retreat_guide}}}}</p>\n' + p('{{contact.retreat_summary}}', mb=24)
     + '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 10px 10px 0;">' + button('Reserve or ask us', '{{contact.retreat_booking_link}}')
     + f'</td><td style="padding:0 0 10px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px solid {FOREST};"><a href="{{{{contact.retreat_page}}}}" style="display:inline-block;padding:14px 24px;font-size:15px;color:{FOREST};text-decoration:none;">Read more</a></td></tr></table></td></tr></table>\n', bg='#f5f3ee')
  + section(label('COMING UP AT THE FINCA') + p('{{contact.upcoming_retreats}}', mb=12) + f'<p style="margin:0;font-size:15px;"><a href="{SITE}/upcoming-retreats" style="color:{SLATE};">See the full {YEAR} calendar</a></p>\n')
  + photo('sitka-long-dinner', 'Guests around a long dinner table at the Finca')
  + section(label('BEFORE YOU BOOK') + p(f'Every guest fills in a short medical questionnaire, because some medications and conditions do not mix with these medicines (<a href="{SITE}/medical" style="color:{SLATE};">read why</a>). To hold your place we take a 50% deposit, non-refundable but transferable to another date. The balance is charged two weeks before the retreat.') + p('Prefer to talk it through? Book a free 30-minute call with us.', mb=22) + button('Book a call', CALL) + '<p style="margin:22px 0 0;"></p>\n' + sign('See you soon,'))
  + foot())

# 2. Newsletter welcome ($100 USD off).
upcoming3 = [r for r in finca_next if r.get('bookingUrl')][:3]
templates['02-newsletter-welcome'] = ('Welcome to MexiSol World: your $100 USD is waiting',
  head('Welcome to MexiSol World', 'Thank you for joining us. Your $100 USD retreat discount, and what to expect from our letters.')
  + hero('lavender-path-with-the-greenhouse-behind', 'Lavender path with the greenhouse behind at Finca El Péndulo', 'WELCOME TO THE LIST', 'Your $100 USD is waiting', 'Thank you for joining us. Here is your welcome gift.', f'See the {YEAR} dates', SITE + '/upcoming-retreats')
  + section(label('YOUR DISCOUNT') + h2('$100 USD off any retreat at the Finca') + p('It is already saved with your name. When you book, tell us you are on the list and we take $100 USD off your stay when we confirm your place. One discount per booking: it does not combine with the shared-room discount.', mb=22) + button('Book with your discount', SITE + '/upcoming-retreats', dark=True), bg='#f5f3ee')
  + photo('pool-main-palapa-and-white-tower', 'Pool, main palapa and white tower at the Finca')
  + section(label('WHAT TO EXPECT FROM US') + p('A short letter now and then: new retreat dates, news from the land, our international journeys and the occasional gathering or festival. No noise.') + p('Seven-day ayahuasca and psilocybin retreats run nearly every month at Finca El Péndulo, near Guadalajara. Up to 15 guests, every meal, ceremony and room included.', mb=0))
  + section(label('NEXT AT THE FINCA') + rows([(f"{r['title']}", f"{when(r)} &middot; {guide(r)}", SITE + PAGE.get(r['medicine'], '/upcoming-retreats')) for r in upcoming3]), top_line=True)
  + photo('blog-ceremony-circle', 'Flower mandala prepared for a ceremony')
  + section(p('Questions before you book? Reply to this email, write to us on <a href="' + WA + '" style="color:' + SLATE + ';">WhatsApp</a> or book a free call.', mb=22) + button('Book a call', CALL) + '<p style="margin:22px 0 0;"></p>\n' + sign('Warmly,'))
  + foot())

# 3. Calendar for the year in retreats.json (GHL name and file stay "03-calendar-2027").
cal_rows = [(r['title'], f"{when(r)} &middot; {guide(r)}", SITE + PAGE.get(r['medicine'], '/upcoming-retreats')) for r in finca_cal]
intl_rows = [((r['title'] if r['location'] == 'Europe' else f"{r['location']}"), f"{when(r)} &middot; {r['title'] if r['location'] != 'Europe' else r.get('subtitle', '')}", SITE + '/international-retreats') for r in intl]
templates['03-calendar-2027'] = (f'Your {YEAR} calendar from MexiSol World',
  head(f'The {YEAR} calendar', f'Every retreat at Finca El Péndulo and our international journeys in {YEAR}.')
  + hero('aerial-lake-avalon', 'Lake Avalon and its palapa at Finca El Péndulo', f'THE {YEAR} CALENDAR', 'A year of ceremony, here and abroad', 'As promised, here are all our upcoming dates.', 'Open the live calendar', SITE + '/upcoming-retreats')
  + section(label('AT FINCA EL PÉNDULO, JALISCO') + h2('Retreats at the Finca') + p('Seven days, six nights, up to 15 guests. Prices from $1,850 USD per person, with meals, activities and your room included.', mb=20) + rows(cal_rows))
  + photo('fire-circle-at-night', 'Fire circle at night at the Finca')
  + section(label('INTERNATIONAL JOURNEYS') + h2('Beyond Mexico') + p('The same team and the same care, away from home. Prices and booking details are on their way.', mb=20) + rows(intl_rows))
  + photo('web-india-group', 'Our group on a journey in India')
  + section(p('Dates fill up, and groups stay small. If one of these calls you, book a free call and we will help you choose.', mb=22) + button('Book a call', CALL) + '<p style="margin:22px 0 0;"></p>\n' + sign(f'See you in {YEAR},'))
  + foot())

# 4. Follow-up, day 2 after a request.
templates['04-followup-day2'] = ('Any questions, {{contact.first_name}}?',
  head('Any questions?', 'A free 30-minute call, or just reply. We are happy to help.')
  + hero('hormiguero-a-palm-roofed-building-among', 'Palm-roofed stone hut among the gardens at the Finca', 'A QUICK NOTE', 'Any questions, {{contact.first_name}}?', 'Choosing a retreat is a big step. We are here to help.')
  + section(p('A couple of days ago you asked about <strong>{{contact.retreat_name}}</strong>. Most people have questions at this point: about the medicine, about their health and medications, or simply about what the days feel like.') + p('The easiest way to answer them is a free 30-minute call with our team. We go over your health and what you are hoping for. Nothing is confirmed until then.', mb=24) + button('Book a free call', CALL) + '<p style="margin:24px 0 0;"></p>\n' + p(f'Prefer to write? Just reply to this email, or message us on <a href="{WA}" style="color:{SLATE};">WhatsApp at +52 378 790 0992</a>.', mb=0))
  + section(label('GOOD TO READ BEFORE THE CALL') + rows([('Medical information', 'Medications and conditions that do not mix with the medicines', SITE + '/medical'), ('How to prepare', 'Diet, intention and what to bring', SITE + '/prepare'), ('The retreat you asked about', '{{contact.retreat_dates}}', '{{contact.retreat_page}}')]) + '<p style="margin:24px 0 0;"></p>\n' + sign('Talk soon,'), top_line=True)
  + foot())

# 5. Follow-up, day 5: what a week looks like + guest words.
week = [('Day 1', 'Check in, walk the land, meet the group over dinner.'), ('Day 2', 'Intentions, a quiet afternoon, first ceremony at night.'), ('Day 3', 'Rest, journaling and a Satori ceremony.'), ('Day 4', 'Optional yoga or breathwork, one-on-one time, second ceremony.'), ('Day 5', 'Group integration and a fire circle at night.'), ('Day 6', 'Sunrise hike, temazcal, cacao in the Osho Hut, closing dinner.'), ('Day 7', 'Breakfast, goodbyes, ride to the airport.')]
week_html = f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid {LINE};">\n' + ''.join(f'<tr><td width="80" valign="top" style="padding:12px 0;border-top:1px solid {LINE};font-size:13px;letter-spacing:0.15em;color:{FOREST};">{d.upper()}</td><td style="padding:12px 0;border-top:1px solid {LINE};font-size:16px;line-height:1.5;">{t}</td></tr>\n' for d, t in week) + '</table>\n'
templates['05-followup-day5'] = ('What a week at the Finca feels like',
  head('A week at the Finca', 'Seven days of ceremony, rest and good food, and what our guests say about it.')
  + hero('guests-sharing-a-candlelit-dinner-at', 'Guests sharing a candlelit dinner at the Finca', 'SEVEN DAYS AT THE FINCA', 'What a week here feels like', 'Ceremony, rest, good food and people who become friends.')
  + section(label('THE WEEK') + p('The schedule moves with the group, and every ceremony is optional. A typical ayahuasca week looks like this:', mb=20) + week_html)
  + two_photos('sitka-morning-stretch', 'Morning stretch on the lawn', 'web-riders', 'Guests on a horseback ride')
  + section(label('IN THEIR WORDS') + quote('From the first day, I felt cared for and safe.', 'Jay &middot; BookRetreats, April 2025') + quote('One of the best things I\'ve ever done in my life.', 'Thibault &middot; BookRetreats, May 2025') + quote('The location itself is a little magical, with nature, animals, and sacred spaces.', 'Jannie &middot; BookRetreats, May 2025') + p(f'Rated 5.0 from 55 reviews on BookRetreats and 4.92 from 181 reviews on Retreat Guru, where we were known as MexiSoul Retreats.', color=MUTED, size=14, mb=0), bg='#f5f3ee')
  + section(p('If {{contact.retreat_name}} is calling you, the next step is a short call with us.', mb=22) + button('Book a free call', CALL) + '<p style="margin:22px 0 0;"></p>\n' + sign())
  + foot())

# 6. Follow-up, day 10: last gentle note.
templates['06-followup-day10'] = ('Still thinking it over? That is fine',
  head('Still thinking it over?', 'No rush. Here is how to hold a place when you are ready.')
  + hero('blog-candles-flowers', 'Candles and flowers prepared for a ceremony', 'NO RUSH', 'Still thinking it over?', 'That is completely fine. This is our last note about your request.')
  + section(p('Coming to a retreat is a real decision, and the right time matters. When you feel ready, here is how it works:', mb=20)
     + rows([('1. Talk to us', 'A free 30-minute call about your health, medications and intention', CALL), ('2. Medical questionnaire', 'So we can confirm the medicine is safe for you', SITE + '/medical'), ('3. Hold your place', '50% deposit, non-refundable but transferable to another date. The balance is charged two weeks before.', '{{contact.retreat_booking_link}}')]) + '<p style="margin:24px 0 0;"></p>\n' + button('Book a free call', CALL))
  + photo('web-agave-rows', 'Rows of blue agave at the Finca')
  + section(p(f'If the dates you looked at do not work, there are retreats almost every month in {YEAR}.', mb=12) + f'<p style="margin:0 0 24px;font-size:15px;"><a href="{SITE}/upcoming-retreats" style="color:{SLATE};">See all {YEAR} dates</a></p>\n' + p('We will keep you posted with news and new dates from time to time. Whenever you are ready, we will be here.', mb=22) + sign('With care,'))
  + foot())

if __name__ == '__main__':  # campaigns import the helpers above without rewriting these files
    for name, (subject, html) in templates.items():
        open(os.path.join(HERE, name + '.html'), 'w').write(html)
    open(os.path.join(HERE, 'subjects.json'), 'w').write(json.dumps({k: v[0] for k, v in templates.items()}, indent=1, ensure_ascii=False))
    print('\n'.join(f'{k}: {len(v[1])} chars, subject: {v[0]}' for k, v in templates.items()))
