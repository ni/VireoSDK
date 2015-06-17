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

