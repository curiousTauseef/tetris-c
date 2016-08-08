#include <stdio.h>
#include <stdlib.h>
#include <float.h>
#include <string.h>
#include <assert.h>
#include "tetris.h"

#define RAND(len) (rand()%(len))

#define FEATIDX_RELIEF 0
#define FEATIDX_RELIEF_AVG 1
#define FEATIDX_RELIEF_VAR 2
#define FEATIDX_GAPS 3
#define FEATIDX_GAPS_EXP 4
#define FEATIDX_OBS 5
#define FEATIDX_OBS_EXP 6
// #define FEATIDX_CLEARED_COUNT 8
// #define FEAT_COUNT 9
#define FEAT_COUNT 8
#define MAX_MUTATION 2.5


/*typedef struct {
  double (*raw_value)(grid* g, double* ordered_raws);
  double weight;
} feature;

typedef *feature heuristic;*/

void feature_gaps ( grid* g, double* ordered_raws );
void feature_variance ( grid* g, double* ordered_raws );

double grid_eval ( grid* g, double* weights )	{
  double raws[FEAT_COUNT];
  feature_variance(g, raws);
  feature_gaps(g, raws);
  double val = 0;
  int i;
  for ( i = 0; i < FEAT_COUNT; i++ )	{
    val += raws[i]*weights[i];
  }
  return val;
}

game_move* ai_best_move ( grid* g, shape_stream* stream, double* weights,
		       int depth_left, double* result_value );

game_move* ai_best_move ( grid* g, shape_stream* stream, double* w,
		      int depth_left, double* value )	{
  double best_score = -DBL_MAX;
  game_move* best_move = malloc(sizeof(game_move));

  int depth = stream->max_len-depth_left;
  shape* s = shape_stream_peek(stream, depth);
  block* b = block_new(s);
  int max_cols = g->width - b->shape->rot_wh[b->rot][0];
  int max_rots = b->shape->rot_count;
  int r;
  for ( r = 0; r < max_rots; r++ )	{
      int c;
      for ( c = 0; c < max_cols; c++ )	{
	grid_block_center_top(g, b);
	b->offset[0] = c;
	b->rot = r;
	grid_block_drop(g, b);
	grid_block_add(g, b);
	double curr;
	if (depth_left)	{
	  ai_best_move(g, stream, w, depth_left-1, &curr);
	}else 	{
	  curr = grid_eval(g, w);
	}
	if (curr>best_score)	{
	  best_score = curr;
	  best_move->rot = r;
	  best_move->col = c;
	}
	grid_block_remove(g, b);
      }
  }
  *value = best_score;
  return best_move;
}

double* mutate_weights ( double* weights )	{
  double* mutated = malloc(FEAT_COUNT*sizeof(*mutated));
  memcpy(mutated, weights, FEAT_COUNT*sizeof(*mutated));
  int r = RAND(FEAT_COUNT);
  // http://stackoverflow.com
  // /questions/13408990/how-to-generate-random-float-number-in-c
  // amount is in (-MAX_MUTATION .. MAX_MUTATION)
  double amount = (float)rand()/(float)
    (RAND_MAX/2*MAX_MUTATION) - MAX_MUTATION;
  mutated[r] += amount;
  return mutated;
}

void feature_variance ( grid* g, double* ordered_raws )	{
  double avg, var, max;
  max = 0;
  int width = g->width;
  int i;

  for ( i = 0; i < width; i++ )	{
    int curr = g->relief[i];
    if (curr>max)	{
      max = curr;
    }
    avg+=curr;
  }
  avg/=width;
  for ( i = 0; i < g->width; i++ )	{
    double diff = avg-g->relief[i];
    var += diff*diff;
  }
  ordered_raws[FEATIDX_RELIEF] = max;
  ordered_raws[FEATIDX_RELIEF_AVG] = avg;
  ordered_raws[FEATIDX_RELIEF_VAR] = var;
  // return var;
}

void feature_gaps ( grid* g, double* ordered_raws )	{
  int gaps = 0, obs = 0, obs_exp = 0, gaps_exp = 0;
  int c;
  for ( c = 0; c < g->width; c++ )	{
    int r;
    // this is not row-major
    for ( r = g->relief[c]; r >= 0; r-- )	{
      if (!g->rows[r][c])	{
	gaps++;
	// penalize higher gaps more heavily
	// this encourages to fix gaps near the top first
	gaps_exp += 1<<r;
      }else 	{
	obs++;
	obs_exp += 1<<r;
      }
    }
  }
  ordered_raws[FEATIDX_GAPS] = gaps;
  ordered_raws[FEATIDX_GAPS_EXP] = gaps;
  ordered_raws[FEATIDX_OBS] = gaps;
  ordered_raws[FEATIDX_OBS_EXP] = gaps;
  // ordered_raws[FEATIDX_CLEARED_COUNT] = ;
}

void test_feature (  )	{
  grid* g = grid_new(GRID_HEIGHT, GRID_WIDTH);
  grid_set_color(g, 2, 0, 1);
  double raws[FEAT_COUNT];
  feature_gaps(g, raws);
  assert(raws[FEATIDX_GAPS] == 2);
  assert(raws[FEATIDX_OBS] == 0);
  grid_set_color(g, 4, 0, 1);
  assert(raws[FEATIDX_GAPS] == 3);
  assert(raws[FEATIDX_OBS] == 1);
}