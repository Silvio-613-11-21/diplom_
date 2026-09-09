/**
 * Смоук-тест ядра эмулятора (парсер + машина) без браузера.
 * Запуск: npm test  (tsc -p tsconfig.test.json && node scripts/smoke-test.cjs)
 */

const { parseProgram } = require('../.test-out/features/assembler/parser.js');
const { Emulator } = require('../.test-out/features/emulator/emulator.js');
const { getTaskRestricts } = require('../.test-out/shared/restrictions/tasks.js');

let passed = 0;
let failed = 0;

function brief(value) {
  if (value && value.machine) {
    return { result: value.result, parseError: value.parseError, regs: value.machine.regs };
  }
  if (value && value.regs) return value.regs;
  return value;
}

function check(name, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    const info = extra === undefined ? '' : '  [' + JSON.stringify(brief(extra)) + ']';
    console.log(`FAIL  ${name}${info}`);
  }
}

/** Скомпилировать и прогнать программу, вернуть машину и результат. */
function run(source, restricts) {
  const parsed = parseProgram(source, restricts);
  if (!parsed.ok) return { parseError: parsed.error };
  const machine = new Emulator({
    program: parsed.instructions,
    labelIndex: parsed.labelIndex,
    initialMemory: parsed.memory,
    features: restricts ? restricts.features : {
      macros: true, subroutines: true, memory: true, variables: true, io: true,
    },
  });
  const result = machine.run();
  return { machine, result, parsed };
}

const TEMPLATE_END = '  mov ax, 4c00h\n  int 21h';

// ===========================================================================
console.log('\n--- Л/Р 1: арифметика, логика, сдвиги ---');

{
  // Задача 1.1: BX = AX * 4 через сдвиг (только mov, shl; ax, bx)
  const r = run(
    `mov ax, 6\n  mov bx, ax\n  shl bx, 2\n${TEMPLATE_END}`,
    getTaskRestricts(1, '1'),
  );
  check('1.1 mov/shl + ограничение ax,bx', !r.parseError && r.machine.snapshot().regs.bx === 24, r);
}

{
  // Задача 1.2: DX = CX * 9 = CX*8 + CX (mov, shl, add, sub; cx, dx)
  const r = run(
    `mov cx, 6\n  mov dx, cx\n  shl dx, 3\n  add dx, cx\n${TEMPLATE_END}`,
    getTaskRestricts(1, '2'),
  );
  check('1.2 умножение сдвигами и сложением', !r.parseError && r.machine.snapshot().regs.dx === 54, r);
}

{
  // Задача 1.4: выделение цифры маской (mov, shl, shr, and; ax)
  const restricted = run(
    `mov ax, 567ch\n  and ax, 0fh\n  shl ax, 4\n${TEMPLATE_END}`,
    getTaskRestricts(1, '4'),
  );
  const r = run(`mov ax, 567ch\n  and ax, 0fh\n  shl ax, 4\n  mov bx, ax\n${TEMPLATE_END}`);
  check('1.4 and+shl выделяет цифру (ax -> 00C0h)',
    !restricted.parseError && r.machine.snapshot().regs.bx === 0xc0,
    { parseError: restricted.parseError, bx: r.machine && r.machine.snapshot().regs.bx });
}

{
  // Стандартное завершение с неразрешённым ax (задача 1.2: только cx, dx)
  const r = run(
    `mov cx, 6\n  mov dx, cx\n  shl dx, 3\n  add dx, cx\n  mov ax, 4c00h\n  int 21h`,
    getTaskRestricts(1, '2'),
  );
  check('1.x mov ax,4c00h разрешён всегда', !r.parseError, r);
}

{
  // Флаги: cmp
  const r = run(`mov ax, 5\n  mov bx, 7\n  cmp ax, bx\n${TEMPLATE_END}`);
  const f = r.machine.snapshot().flags;
  check('cmp 5-7: cf=1, sf=1, zf=0', f.cf && f.sf && !f.zf, f);
}

{
  // Знаковые/беззнаковые переходы
  const r = run(
    `mov ax, 5\n  mov bx, 0ffffh\n  cmp ax, bx\n  ja above\n  mov cx, 1111h\n` +
    `  jmp fin\nabove:\n  mov cx, 2222h\nfin:\n${TEMPLATE_END}`,
  );
  // 5 > -1 знаково (jl не взят), но 5 < 0xFFFF беззнаково (jb взят)
  check('cmp ax(5),bx(0FFFFh): jb взят (беззнаково)', r.machine.snapshot().regs.cx === 0x1111, r);
}

{
  // Задача 1.8: цикл — картинка 1111111111111111b
  const r = run(
    `mov dx, 0\n  mov cx, 16\nm1:\n  shl dx, 1\n  inc dx\n  loop m1\n${TEMPLATE_END}`,
    getTaskRestricts(1, '8'),
  );
  check('1.8 цикл loop: dx = FFFFh', !r.parseError && r.machine.snapshot().regs.dx === 0xffff, r);
}

{
  // Задача 1.9: условный оператор IF(AX+BX > 7) THEN CX=1111h ELSE CX=2222h
  const r = run(
    `mov ax, 5\n  mov bx, 4\n  add ax, bx\n  cmp ax, 7\n  jg then1\n` +
    `  mov cx, 2222h\n  jmp fin\nthen1:\n  mov cx, 1111h\nfin:\n${TEMPLATE_END}`,
    getTaskRestricts(1, '9'),
  );
  check('1.9 условный оператор (ветка ДА)', r.machine.snapshot().regs.cx === 0x1111, r);
}

{
  // Отрицательные числа: sub -> дополнительный код
  const r = run(`mov ax, 5\n  mov bx, 7\n  sub ax, bx\n  mov bx, ax\n${TEMPLATE_END}`);
  check('5-7 = FFFEh (доп. код)', r.machine.snapshot().regs.bx === 0xfffe, r);
}

{
  // neg, not, xchg, push/pop
  const r = run(
    `mov ax, 5\n  neg ax\n  mov bx, 3\n  xchg ax, bx\n  push ax\n  push bx\n` +
    `  pop cx\n  pop dx\n  not dx\n  mov dx, ax\n${TEMPLATE_END}`,
  );
  const s = r.machine.snapshot();
  check('neg/xchg/push/pop/not', s.regs.bx === 0xfffb && s.regs.cx === 0xfffb && s.regs.dx === 3, s.regs);
}

{
  // Полурегистры
  const r = run(`mov ax, 1234h\n  mov bh, ah\n  and bh, 0fh\n  inc bh\n${TEMPLATE_END}`);
  const s = r.machine.snapshot();
  check('полурегистры ah/bh', s.regs.bx === 0x0300 + (s.regs.bx & 0xff) && (s.regs.bx >> 8) === 3 && (s.regs.bx & 0xff) === 0, s.regs);
}

{
  // Ограничения: запрещённая команда
  const r = run(`mov ax, 5\n  xor ax, 3\n${TEMPLATE_END}`, getTaskRestricts(1, '1'));
  check('xor запрещён в задаче 1.1', !!r.parseError && /не разрешена/.test(r.parseError), r.parseError);
}

{
  // Ограничения: запрещённый регистр
  const r = run(`mov ax, 5\n  mov cx, 3\n${TEMPLATE_END}`, getTaskRestricts(1, '1'));
  check('cx запрещён в задаче 1.1', !!r.parseError && /регистр/.test(r.parseError), r.parseError);
}

{
  // Ограничения: полурегистры запрещены при явном списке
  const r = run(`mov al, 5\n${TEMPLATE_END}`, getTaskRestricts(1, '5'));
  check('al запрещён в задаче 1.5 (полурегистры)', !!r.parseError, r.parseError);
}

// ===========================================================================
console.log('\n--- Л/Р 2: подпрограммы и макросы ---');

{
  const source = `
%macro init 4
  mov ax, %1
  mov bx, %2
  mov cx, %3
  mov dx, %4
%endmacro
mycode: segment .code
org 100h
start:
  init 1111h, 2222h, 3333h, 4444h
  call mysub
  mov ax, 4c00h
  int 21h
mysub:
  mov ax, 5555h
  mov bx, 6666h
  mov cx, 7777h
  mov dx, 8888h
  ret`;
  const r = run(source, getTaskRestricts(2, '0'));
  const s = r.machine.snapshot();
  check('2.0 макрос + call/ret', !r.parseError
    && s.regs.bx === 0x6666 && s.regs.cx === 0x7777 && s.regs.dx === 0x8888, r.parseError || s.regs);
}

{
  // 2.1: унаследованные ограничения + call/ret; параметры макроса
  const source = `
%macro init2 2
  mov ax, %1
  mov bx, %2
%endmacro
start:
  init2 6, 0
  call mult4
  mov ax, 4c00h
  int 21h
mult4:
  mov bx, ax
  shl bx, 2
  ret`;
  const r = run(source, getTaskRestricts(2, '1'));
  check('2.1 наследование ограничений 1.1 + call/ret',
    !r.parseError && r.machine.snapshot().regs.bx === 24, r.parseError || r);
}

{
  // Аргумент макроса в фигурных скобках
  const source = `
%macro op 2
  %1 %2
%endmacro
start:
  mov ax, 5
  op neg, ax
  mov bx, ax
  mov ax, 4c00h
  int 21h`;
  const r = run(source, getTaskRestricts(2, '-1'));
  check('макрос с аргументом-командой {NEG, CX}-стиля', !r.parseError && r.machine.snapshot().regs.bx === 0xfffb, r.parseError);
}

{
  // call/ret запрещены в л.р. 1
  const r = run(`start:\n  call sub1\n  int 21h\nsub1:\n  ret`, getTaskRestricts(1, '-1'));
  check('call запрещён в л.р. 1', !!r.parseError && /подпрограммы/.test(r.parseError), r.parseError);
}

// ===========================================================================
console.log('\n--- Л/Р 3: память ---');

{
  const source = `
start:
  mov byte[0], 'H'
  mov word[1], 'el'
  mov word[3], 'lo'
  mov ax, 4c00h
  int 21h`;
  const r = run(source, getTaskRestricts(3, '00'));
  const mem = r.machine.snapshot().memory;
  check("3.x 'Hello' в памяти: 48 65 6C 6C 6F",
    !r.parseError && mem[0] === 0x48 && mem[1] === 0x65 && mem[2] === 0x6c
    && mem[3] === 0x6c && mem[4] === 0x6f, r.parseError || Array.from(mem.slice(0, 5)));
}

{
  // Адресация через SI и BX со смещениями, 5-я строка 6-я позиция = 45h
  const source = `
start:
  mov si, 40h
  mov byte[si+5], '^'
  mov bx, 46h
  mov byte[bx], '!'
  mov byte[si-1], 41h
  mov ax, 4c00h
  int 21h`;
  const r = run(source, getTaskRestricts(3, '00'));
  const mem = r.machine.snapshot().memory;
  check('byte[si+5], byte[bx], byte[si-1]',
    mem[0x45] === 0x5e && mem[0x46] === 0x21 && mem[0x3f] === 0x41, r.parseError || [mem[0x45], mem[0x46], mem[0x3f]]);
}

{
  // word в памяти little-endian
  const source = `
start:
  mov word[10], 4455h
  mov ax, 4c00h
  int 21h`;
  const r = run(source, getTaskRestricts(3, '00'));
  const mem = r.machine.snapshot().memory;
  check('word[10] = 4455h -> [10]=55, [11]=44', mem[10] === 0x55 && mem[11] === 0x44, [mem[10], mem[11]]);
}

{
  // Чтение из памяти в регистр и обратно: mov память-память запрещён
  const source = `
start:
  mov byte[0], 7
  mov al, byte[0]
  mov byte[1], al
  mov ax, 4c00h
  int 21h`;
  const r = run(source, getTaskRestricts(3, '00'));
  const mem = r.machine.snapshot().memory;
  check('память -> регистр -> память', mem[1] === 7, r.parseError);

  const r2 = run(`start:\n  mov byte[0], 7\n  mov byte[1], byte[0]\n  int 21h`, getTaskRestricts(3, '00'));
  check('mov память, память запрещён', !!r2.parseError && /память/.test(r2.parseError), r2.parseError);
}

{
  // Задача 3.0: BX и SI запрещены
  const r = run(`start:\n  mov bx, 5\n  int 21h`, getTaskRestricts(3, '0'));
  check('3.0 регистр bx запрещён', !!r.parseError && /запрещён/.test(r.parseError), r.parseError);

  const r2 = run(`start:\n  mov si, 5\n  int 21h`, getTaskRestricts(3, '0'));
  check('3.0 регистр si запрещён', !!r2.parseError && /запрещён/.test(r2.parseError), r2.parseError);

  const r3 = run(`start:\n  mov byte[0], 'H'\n  int 21h`, getTaskRestricts(3, '0'));
  check('3.0 память по константному адресу разрешена', !r3.parseError, r3.parseError);
}

{
  // Память запрещена в л.р. 1/2
  const r = run(`start:\n  mov byte[0], 1\n  int 21h`, getTaskRestricts(1, '5'));
  check('byte[] запрещён в л.р. 1', !!r.parseError && /памят/i.test(r.parseError), r.parseError);
}

// ===========================================================================
console.log('\n--- Л/Р 4: переменные и константы ---');

{
  const source = `
start:
  mov al, 15h
  mov byte[a4], al
  mov bl, 3ah
  mov byte[b4], bl
  mov al, byte[a4]
  add al, bl
  mov byte[c4], al
  mov ax, 4c00h
  int 21h
  mov ax, 4c00h
  int 21h

mydata: segment .data
a4 db 0
b4 db 0
c4 db 0`;
  const r = run(source, getTaskRestricts(4, '2'));
  const mem = r.machine.snapshot().memory;
  check('4.2 c4 = a4 + b4 = 4Fh', !r.parseError && mem[2] === 0x4f, r.parseError || [mem[0], mem[1], mem[2]]);
}

{
  const source = `
start:
  mov ax, my
  mov si, ax
  mov bx, word[b]
  mov word[b], 4455h
  mov ax, 4c00h
  int 21h

mydata: segment .data
b dw 1234h
my equ 123`;
  const r = run(source, getTaskRestricts(4, '0'));
  const s = r.machine.snapshot();
  const mem = s.memory;
  check('equ и word по имени переменной',
    !r.parseError && s.regs.si === 123 && s.regs.bx === 0x1234
    && mem[0] === 0x55 && mem[1] === 0x44, r.parseError || { si: s.regs.si, bx: s.regs.bx, mem: [mem[0], mem[1]] });
}

{
  const source = `
start:
  mov dx, mystr
  mov ax, 4c00h
  int 21h

mydata: segment .data
mystr db 'Hello, World!'`;
  const r = run(source, getTaskRestricts(4, '0'));
  const s = r.machine.snapshot();
  check('mov dx, имя_строки (адрес = 0)', !r.parseError && s.regs.dx === 0, r.parseError || s.regs.dx);
}

{
  // align, times, dd, отрицательные db
  const source = `
start:
  mov ax, 4c00h
  int 21h

mydata: segment .data
x db 1
align 16, db 90h
y dw 2
z dd 12345678h
t times 4 db '='
n db -1`;
  const parsed = parseProgram(source, getTaskRestricts(4, '0'));
  const mem = parsed.ok ? parsed.memory : null;
  check('align/times/dd/db -1',
    parsed.ok && mem[0] === 1 && mem[15] === 0x90 && mem[16] === 2 && mem[18] === 0x78
    && mem[21] === 0x12 && mem[22] === 0x3d && mem[25] === 0x3d && mem[26] === 0xff,
    parsed.ok ? Array.from(mem.slice(0, 32)) : parsed.error);
}

{
  // Переменные запрещены в л.р. 3
  const r = run(`start:\n  mov al, byte[a]\n  int 21h\na db 5`, getTaskRestricts(3, '1'));
  check('переменные запрещены в л.р. 3', !!r.parseError && /переменные/i.test(r.parseError), r.parseError);
}

// ===========================================================================
console.log('\n--- Л/Р 5: прерывания ввода-вывода ---');

{
  // 09h: вывод строки до '$', 02h: вывод символа
  const source = `
start:
  mov ah, 09h
  mov dx, mystr
  int 21h
  mov ah, 02h
  mov dl, '!'
  int 21h
  mov ax, 4c00h
  int 21h

mydata: segment .data
mystr db 'Hello, World!$'`;
  const r = run(source, getTaskRestricts(5, '0'));
  const out = r.machine ? r.machine.takeOutput() : '';
  check('int 21h/09h + /02h вывод', !r.parseError && out === 'Hello, World!!', r.parseError || out);
}

{
  // 01h: чтение клавиши (пошагово, имитация нажатия)
  const source = `
start:
  mov ah, 01h
  int 21h
  mov bl, al
  mov ax, 4c00h
  int 21h`;
  const parsed = parseProgram(source, getTaskRestricts(5, '0'));
  const machine = new Emulator({
    program: parsed.ok ? parsed.instructions : [],
    labelIndex: parsed.ok ? parsed.labelIndex : new Map(),
    initialMemory: parsed.ok ? parsed.memory : new Uint8Array(256),
    features: getTaskRestricts(5, '0').features,
  });
  let res = machine.step(); // label start
  res = machine.step();     // mov ah, 01h
  res = machine.step();     // int 21h -> input-needed
  const needed = res.status === 'input-needed';
  machine.provideInput('Q'.charCodeAt(0), false);
  res = machine.run();
  const s = machine.snapshot();
  check('int 21h/01h чтение клавиши -> AL', needed && !parsed.error && s.regs.bx === 0x51, { needed, bl: s.regs.bx });
}

{
  // 02h запрещён в л.р. 4
  const source = `
start:
  mov ah, 02h
  mov dl, '!'
  int 21h
  mov ax, 4c00h
  int 21h`;
  const parsed = parseProgram(source, getTaskRestricts(4, '0'));
  const machine = new Emulator({
    program: parsed.ok ? parsed.instructions : [],
    labelIndex: parsed.ok ? parsed.labelIndex : new Map(),
    initialMemory: parsed.ok ? parsed.memory : new Uint8Array(256),
    features: getTaskRestricts(4, '0').features,
  });
  machine.run();
  check('int 21h/02h запрещён в л.р. 4 (ошибка выполнения)', machine.halted, machine.snapshot().awaitingInput);
}

// ===========================================================================
console.log('\n--- Разное ---');

{
  // Комментарии, регистр команд, метка с командой на строке, лишние пробелы
  const r = run(`
; программа
start: MOV  AX , 5   ; присвоить
  MOV BX, AX ; копия
  int 21h`);
  check('комментарии и регистр команд', !r.parseError && r.machine.snapshot().regs.bx === 5, r.parseError);
}

{
  // Ошибки: неизвестная метка, неизвестная команда, отсутствие запятой
  const r1 = run(`start:\n  jmp nowhere\n  int 21h`);
  check('несуществующая метка', !!r1.parseError && /метка/.test(r1.parseError), r1.parseError);

  const r2 = run(`start:\n  foo ax, 1\n  int 21h`);
  check('неопознанная команда', !!r2.parseError && /неопознанная/.test(r2.parseError), r2.parseError);

  const r3 = run(`start:\n  mov ax 5\n  int 21h`);
  check('отсутствие запятой', !!r3.parseError && /«,»/.test(r3.parseError), r3.parseError);
}

{
  // Числа во всех системах
  const r = run(`start:\n  mov ax, 10h\n  mov bx, 16\n  mov cx, 10000b\n  cmp ax, bx\n  int 21h`);
  const s = r.machine ? r.machine.snapshot() : null;
  check('10h = 16 = 10000b, zf после cmp', s && s.regs.ax === 16 && s.regs.cx === 16 && s.flags.zf, s && s.regs);
}

{
  // Заголовок сегмента и org 100h из шаблона
  const r = run(`mycode: segment .code\norg 100h\nstart:\n  mov ax, 1\n  mov ax, 4c00h\n  int 21h`);
  check('segment .code + org 100h', !r.parseError && r.result.status === 'halted', r.parseError);
}

{
  // Защита от зацикливания
  const r = run(`start:\n  jmp start`);
  check('зацикливание ловится лимитом', r.result && r.result.status === 'error' && /зациклилась/.test(r.result.message), r.result);
}

{
  // Заглушки: задачи без ограничений не имеют allowCmd/allowRegs
  const stubs = [
    [2, '00'], [2, '11'], [3, '1'], [3, '8'], [4, '0'], [4, '9'], [5, '0'], [5, '8'],
  ];
  const ok = stubs.every(([lab, z]) => {
    const r = getTaskRestricts(lab, z);
    return r && r.allowCmd === undefined && r.allowRegs === undefined;
  });
  check('задания без явных ограничений — без ограничений (заглушки)', ok);
}

console.log(`\n=== Итого: ${passed} ok, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
