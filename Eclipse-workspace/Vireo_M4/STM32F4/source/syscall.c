/*
The MIT License (MIT)

Copyright (c) 2014 ARMstrap Community

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>

#include "stm32f4xx_gpio.h"
#include "stm32f4xx_rcc.h"
#include "stm32f4xx_usart.h"

#ifndef STDIN_FILENO
	#define STDIN_FILENO 0
	#define STDOUT_FILENO 1
	#define STDERR_FILENO 2
#endif

//------------------------------------------------------------
//! Venerable global error global still used by math libraries.
error_t errno;

//------------------------------------------------------------
/*
 sbrk
 Increase program data space.
 Malloc and related functions depend on this
 */
caddr_t _sbrk(int incr)
{
    extern int _end; // Defined by the linker script
    static char *heap_end;
    char *prev_heap_end;

    if (heap_end == 0) {
        heap_end = (char*)&_end;
    }

    prev_heap_end = heap_end;
    heap_end += incr;
    return (caddr_t) prev_heap_end;
}

//------------------------------------------------------------
extern void (*__preinit_array_start []) (void) __attribute__((weak));
extern void (*__preinit_array_end []) (void) __attribute__((weak));
extern void (*__init_array_start []) (void) __attribute__((weak));
extern void (*__init_array_end []) (void) __attribute__((weak));

/*
 std_cpp_init
 Call global constructors an initializers.
 */
void std_cpp_init()
{
	unsigned int count;
	unsigned int i;

	count = __preinit_array_end - __preinit_array_start;
	for (i = 0; i < count; i++) {
		__preinit_array_start[i] ();
	}

	count = __init_array_end - __init_array_start;
	for (i = 0; i < count; i++) {
		__init_array_start[i] ();
	}
}

//------------------------------------------------------------
void std_io_init()
{
	// enable the peripheral clocks
	RCC_APB1PeriphClockCmd(RCC_APB1Periph_USART2, ENABLE);
	RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOD, ENABLE);

	// This sequence sets up the TX and RX GPIO pins so they work correctly
	// with the USART peripheral
	GPIO_InitTypeDef usartGPIO;
	usartGPIO.GPIO_Pin = GPIO_Pin_5 | GPIO_Pin_6; // Pin 5 (TX), Pin 6 (RX)
	usartGPIO.GPIO_Mode = GPIO_Mode_AF;
	usartGPIO.GPIO_Speed = GPIO_Speed_50MHz;
	usartGPIO.GPIO_OType = GPIO_OType_PP;
	usartGPIO.GPIO_PuPd = GPIO_PuPd_UP;
	GPIO_Init(GPIOD, &usartGPIO);

	// The RX and TX pins are now connected to their AF
	// so that the USART1 can take over control of the pins
	GPIO_PinAFConfig(GPIOD, GPIO_PinSource5, GPIO_AF_USART2);
	GPIO_PinAFConfig(GPIOD, GPIO_PinSource6, GPIO_AF_USART2);

	// Define the properties of USART
	USART_InitTypeDef consoleUSART;
	consoleUSART.USART_BaudRate = 115200;  //9600;
	consoleUSART.USART_WordLength = USART_WordLength_8b;
	consoleUSART.USART_StopBits = USART_StopBits_1;
	consoleUSART.USART_Parity = USART_Parity_No;
	consoleUSART.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
	consoleUSART.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
	USART_Init(USART2, &consoleUSART);

	// finally enable the USART peripheral
	USART_Cmd(USART2, ENABLE);

	// Initialize SysTick timer
//	SysTick_Config(SystemCoreClock / 1000);
}

uint32_t gTickCount = 0;

//------------------------------------------------------------
void SysTick_Handler()
{
	gTickCount++;
}
//------------------------------------------------------------
void usart_putchar(USART_TypeDef* USARTx, const char c)
{
	// wait until data register is empty
	while( !(USARTx->SR & USART_FLAG_TC) );
	USART_SendData(USARTx, c);
}
//------------------------------------------------------------
void usart_write(USART_TypeDef* USARTx, const char* s, int len)
{
	while(len){
		if (*s == '\n') {
			usart_putchar(USARTx, '\r');
		}
		usart_putchar(USARTx, *s);
		s++;
		len--;
	}
}
//------------------------------------------------------------
int _getpid()
{
    return 1;
}
//------------------------------------------------------------
int _kill(int pid, int sig)
{
    errno = EINVAL;
    return (-1);
}
//------------------------------------------------------------
int _fstat(int file, struct stat *st)
{
    st->st_mode = S_IFCHR;
    return 0;
}
//------------------------------------------------------------
int _isatty(int file)
{
	return 0;
}
//------------------------------------------------------------
int _read(int file, char *ptr, int len)
{
	return -1;
}
//------------------------------------------------------------
int _write(int file, char *ptr, int len)
{
	if (file == STDOUT_FILENO) {
		usart_write(USART2, ptr, len);
	}
	return -1;
}
//------------------------------------------------------------
int _lseek(int file, int ptr, int dir)
{
    return 0;
}
//------------------------------------------------------------
int _close(int file)
{
    return -1;
}
//------------------------------------------------------------
void _exit(int status)
{
	int i = 0;
	while(1) {
		i++;
	}
}
//------------------------------------------------------------
void __cxa_pure_virtual()
{
	while(1);
}
