mod utils;

extern crate fixedbitset;
extern crate rand;

use fixedbitset::FixedBitSet;
use rand::prelude::*;
use wasm_bindgen::prelude::*;

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
        let width = (2 * self.span + 1) as usize;
        let mut carry_over = self.cells[width-1];
        let start = self.cells[0];

        for j in 0..width {
            let k = if j == width - 1 { start } else { self.cells[j + 1] };
            let bits = [carry_over, self.cells[j], k];

            let outcome = pattern.outcome(&bits).unwrap();

            carry_over = self.cells[j];
            self.cells.set(j, outcome);
        }
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
