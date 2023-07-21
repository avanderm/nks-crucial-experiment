mod utils;

extern crate fixedbitset;
extern crate rand;
extern crate web_sys;

use fixedbitset::FixedBitSet;
use rand::prelude::*;
use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
pub struct Universe {
    span: u32,
    cells: FixedBitSet,
}

#[wasm_bindgen]
impl Universe {
    pub fn new() -> Universe {
        let span = 200 as u32;
        let size = (2 * span + 1) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        for i in 0..size as usize {
            cells.set(i, false);
        }
        let midpoint = (span + 1) as usize;
        cells.set(midpoint, true);

        Universe {
            span,
            cells,
        }
    }

    pub fn span(&self) -> u32 {
        self.span
    }

    pub fn set_span(&mut self, span: u32) {
        self.span = span;

        let size = (2 * span + 1) as usize;
        self.cells = FixedBitSet::with_capacity(size);

        let midpoint = (span + 1) as usize;
        self.cells.set(midpoint, true);
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn count_active(&self) -> u32 {
        self.cells.count_ones(..) as u32
    }

    pub fn tick(&mut self, pattern: &Pattern) {
        utils::set_panic_hook();
        log!("computing tick");

        let width = (2 * self.span + 1) as usize;
        let rs = ((pattern.r - 1) / 2) as usize;

        let mut carry_over: VecDeque<bool> = VecDeque::with_capacity(rs);
        (width-rs..width).for_each(|i| {
            carry_over.push_back(self.cells[i]);
        });

        let mut start = Vec::with_capacity(rs);
        (0..rs).for_each(|i| {
            start.push(self.cells[i]);
        });

        for i in 0..width {
            let mut bits = Vec::from(carry_over.as_slices().0);
            bits.push(self.cells[i]);

            if i < width-rs {
                for offset in 1..rs+1 {
                    bits.push(self.cells[i + offset]);
                }
            } else {
                for j in i+1..width {
                    bits.push(self.cells[j]);
                }

                bits.extend(&start[0..(rs - width + i + 1)]);
            }

            let outcome = pattern.outcome(&bits[..]).unwrap();

            carry_over.pop_front();
            carry_over.push_back(self.cells[i]);
            carry_over.make_contiguous();

            self.cells.set(i, outcome);
        }

        log!("last cell: {}", self.cells[width-1]);
    }

    pub fn randomize(&mut self) {
        let width = (2 * self.span + 1) as usize;

        for i in 0..width {
            self.cells.set(i, random());
        }
    }
}

#[derive(Clone, Debug)]
struct LengthError;

#[wasm_bindgen]
pub struct Pattern {
    r: u32,
    outcomes: FixedBitSet,
}

#[wasm_bindgen]
impl Pattern {
    pub fn new(r: u32) -> Pattern {
        let combinations = (2 as usize).pow(r);
        let mut outcomes = FixedBitSet::with_capacity(combinations);

        outcomes.set(0, false);
        for i in 1..combinations {
            outcomes.set(i, true);
        }

        Pattern {
            r,
            outcomes,
        }
    }

    fn outcome(&self, b: &[bool]) -> Result<bool, LengthError> {
        if b.len() != self.r as usize {
            return Err(LengthError);
        }

        let index = b.iter().enumerate().map(|(i, &val)| (val as usize) << i).sum();

        Ok(self.outcomes[index])
    }

    pub fn set_outcome(&mut self, index: usize, outcome: bool) {
        self.outcomes.set(index, outcome);
    }

    pub fn get_outcome(&self, index: usize) -> bool {
        self.outcomes[index]
    }
}
